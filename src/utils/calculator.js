/* ============================================================
 *  赔率计算核心逻辑
 *  移植自 Python 版本 optimize_weights / expect / prod
 *
 *  组合规则：
 *    第 i 场有 2 个赔率 → a_i = [odds_i1, odds_i2]
 *    所有组合 a = [x1 * x2 * ... * xn for x1 in a1 for x2 in a2 ...]
 *    每个组合对应一个"比赛结果"文本，如 "曼联-胜 × 皇马-负"
 * ============================================================ */

/** 四舍五入到最近的偶数 */
export function roundToEven(x) {
  return Math.floor(x / 2 + 0.5) * 2
}

/** 列表乘积 */
export function prod(iterable) {
  let r = 1
  for (const v of iterable) r *= v
  return r
}

/** 期望回报 = 1 / Σ(1/ai) */
export function expect(iterable) {
  const p = prod(iterable)
  let s = 0
  for (const x of iterable) s += p / x
  return p / s
}

/** 样本标准差 */
function stdev(arr) {
  const n = arr.length
  if (n < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / n
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
  return Math.sqrt(variance)
}

/**
 * 权重优化
 * @param {number[]} a   组合赔率列表（每个元素 = 各场赔率乘积）
 * @param {number}   x   阈值
 * @param {number}   m_  下限
 * @param {number}   M_  上限
 */
export function optimizeWeights(a, x = 0.01, m_ = 100, M_ = 1000) {
  const n = a.length
  if (n === 0) throw new Error('输入列表不能为空')
  if (a.some(v => v <= 0)) throw new Error('所有数必须为正数')

  const totalProd = prod(a)
  const w = a.map(ai => totalProd / ai)

  let idxMin = 0
  for (let i = 1; i < n; i++) {
    if (w[i] < w[idxMin]) idxMin = i
  }
  const wMin = w[idxMin]
  const sumW = w.reduce((s, v) => s + v, 0)

  const candidates = []
  const _m = Math.max(2, roundToEven((wMin * m_) / sumW) - 2)
  const _M = roundToEven((wMin * M_) / sumW)

  for (let t = _m; t <= _M + 4; t += 2) {
    const scale = t / wMin
    const newW = w.map(wi => roundToEven(wi * scale))
    newW[idxMin] = t

    const sumNew = newW.reduce((s, v) => s + v, 0)
    if (sumNew < m_) continue
    if (sumNew > M_) break

    const S = newW.map((wi, i) => wi * a[i])
    const M = sumNew
    const D = S.map(s => s - M)

    const meanD = D.reduce((s, v) => s + v, 0) / D.length
    const cv = D.length > 1 ? stdev(D) / meanD : 0
    const rangeVal = Math.max(...D) - Math.min(...D)
    const rangeRatio = M !== 0 ? rangeVal / M : Infinity

    candidates.push({ t, newW, S, M, D, cv, rangeRatio })
  }

  if (candidates.length === 0) {
    throw new Error('没有找到符合条件的候选方案')
  }

  const minCv = Math.min(...candidates.map(c => c.cv))
  const filtered = candidates.filter(c => c.cv <= minCv + x)
  const best = filtered.reduce((a, b) => (a.rangeRatio <= b.rangeRatio ? a : b))

  return {
    idxMin,
    aMin: a[idxMin],
    minCv,
    threshold: minCv + x,
    candidatesCount: candidates.length,
    filteredCount: filtered.length,
    bestT: best.t,
    newWeights: best.newW,       // ★ 即推荐投注额（长度 = 组合数）
    S: best.S,
    M: best.M,                   // 总投注额
    D: best.D,                   // 每个组合的收益
    cv: best.cv,
    rangeRatio: best.rangeRatio
  }
}

/* ============================================================
 *  组合生成
 * ============================================================ */

/**
 * 生成赔率组合
 *
 * @param {Array<{matchName:string, odds1:{label,value}, odds2:{label,value}}>} rows
 * @returns {{
 *   a: number[],            // 组合赔率列表（每项 = 各场赔率乘积）
 *   texts: string[],        // 每个组合对应的比赛结果文本
 *   combos: Array<Array<{matchName, label, value}>>,  // 组合明细
 *   perMatchLabels: string[][]  // 每场可选结果标签
 * }}
 */
export function buildCombinations(rows) {
  const perMatchLabels = rows.map(r => [
    `${r.matchName}-${r.odds1.label}`,
    `${r.matchName}-${r.odds2.label}`
  ])

  const perMatchOptions = rows.map(r => [r.odds1, r.odds2])

  const a = []
  const texts = []
  const combos = []

  const n = rows.length
  function backtrack(idx, currentOdds, currentTexts, currentCombos) {
    if (idx === n) {
      // 组合赔率 = 各场赔率乘积
      const product = currentOdds.reduce((p, v) => p * v, 1)
      a.push(product)
      texts.push(currentTexts.join(' × '))
      combos.push([...currentCombos])
      return
    }

    const row = rows[idx]
    for (let k = 0; k < 2; k++) {
      const opt = perMatchOptions[idx][k]
      currentOdds.push(opt.value)
      currentTexts.push(`${row.matchName}-${opt.label}`)
      currentCombos.push({
        matchIndex: idx,
        matchName: row.matchName,
        label: opt.label,
        value: opt.value
      })
      backtrack(idx + 1, currentOdds, currentTexts, currentCombos)
      currentOdds.pop()
      currentTexts.pop()
      currentCombos.pop()
    }
  }

  backtrack(0, [], [], [])

  return { a, texts, combos, perMatchLabels }
}

/**
 * 完整计算流程
 *
 * @param {Array} rows   每场：{ matchName, odds1:{label,value}, odds2:{label,value} }
 * @param {object} options { x, m_, M_ }
 */
export function computeAll(rows, options = {}) {
  const { x = 0.01, m_ = 100, M_ = 1000 } = options

  // 1. 生成组合
  const { a, texts, combos } = buildCombinations(rows)

  // 2. 期望收益
  const exp = expect(a)

  // 3. 权重优化
  let result = null
  let errorMsg = null
  try {
    result = optimizeWeights(a, x, m_, M_)
  } catch (e) {
    errorMsg = e.message
  }

  // 4. 整理输出：投注额、文本、收益、回报率
  let details = []
  if (result) {
    const { newWeights, D, M } = result
    details = newWeights.map((bet, i) => ({
      index: i,
      bet,                              // 推荐投注额
      text: texts[i],                   // 比赛结果文本
      combo: combos[i],                 // 组合明细
      profit: D[i],                     // 该组合的收益（差值）
      rate: M !== 0 ? D[i] / M : 0      // 回报率 = D[i] / M
    }))
  }

  return {
    // 组合层
    a,
    texts,
    combos,
    expect: exp,                        // 期望收益（第一行展示）

    // 优化结果层
    result,                             // optimize_weights 原始输出
    details,                            // 每个组合的投注额/文本/收益/回报率
    errorMsg
  }
}