/* ============================================================
 *  赔率计算核心逻辑
 *  移植自 Python 版本 optimize_weights / expect / prod
 *
 *  组合规则：
 *    第 i 场有 2 个赔率 → a_i = [odds_i1, odds_i2]
 *    所有组合 a = [x1 * x2 * ... * xn for x1 in a1 for x2 in a2 ...]
 *
 *  严格约束：
 *    M = sum(newWeights) ∈ [m_, M_]
 *    通过 fixSum 主动修正 newW，使其和落在范围内
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
 * ★ 关键：主动修正 newW，使 sum(newW) 严格落在 [m_, M_] 内
 *
 * 修正策略：
 *   1. 若 sum > M_：从"非 idxMin 且值 > 0"的项里，按当前值从大到小依次 -2，
 *      直到 sum <= M_。若一轮不够，继续循环。
 *   2. 若 sum < m_：给"非 idxMin 且值最小"的项 +2，直到 sum >= m_。
 *      优先给小的加，避免破坏原有比例。
 *   3. 若修正后仍无法满足（例如 n=1 且区间无合法偶数值），抛错。
 *
 * @param {number[]} newW
 * @param {number}   idxMin
 * @param {number}   m_
 * @param {number}   M_
 * @returns {number[]} 修正后的 newW
 */
function fixSum(newW, idxMin, m_, M_) {
  const arr = [...newW]
  const n = arr.length

  // 让数组各项始终 >= 2（偶数最小值）
  for (let i = 0; i < n; i++) {
    if (arr[i] < 2) arr[i] = 2
  }
  // 保证 idxMin 项不为 0（但这里不强制等于原 t，允许修正）
  if (arr[idxMin] < 2) arr[idxMin] = 2

  let sum = arr.reduce((s, v) => s + v, 0)

  // ---------- 情况 1：sum > M_，需要减小 ----------
  if (sum > M_) {
    // 除 idxMin 外的项，按当前值从大到小排序
    // 优先减小大项，对比例影响最小
    let guard = 0
    while (sum > M_ && guard++ < 100000) {
      // 每次找当前值最大的非 idxMin 项
      let maxIdx = -1
      let maxVal = -1
      for (let i = 0; i < n; i++) {
        if (i === idxMin) continue
        if (arr[i] > maxVal && arr[i] >= 4) {  // 保证减 2 后仍 >= 2
          maxVal = arr[i]
          maxIdx = i
        }
      }
      if (maxIdx === -1) {
        // 非 idxMin 项都无法再减，尝试减 idxMin
        if (arr[idxMin] >= 4) {
          arr[idxMin] -= 2
          sum -= 2
        } else {
          break   // 无法再减
        }
      } else {
        arr[maxIdx] -= 2
        sum -= 2
      }
    }
  }

  // ---------- 情况 2：sum < m_，需要增大 ----------
  if (sum < m_) {
    let guard = 0
    while (sum < m_ && guard++ < 100000) {
      // 每次找当前值最小的非 idxMin 项（或者 idxMin 若它最小）
      let minIdx = -1
      let minVal = Infinity
      for (let i = 0; i < n; i++) {
        if (i === idxMin) continue
        if (arr[i] < minVal) {
          minVal = arr[i]
          minIdx = i
        }
      }
      if (minIdx !== -1) {
        arr[minIdx] += 2
        sum += 2
      } else {
        // 只有 idxMin 一项
        arr[idxMin] += 2
        sum += 2
      }
    }
  }

  return arr
}

/**
 * 权重优化
 *
 * @param {number[]} a   组合赔率列表
 * @param {number}   x   阈值
 * @param {number}   m_  投注总额下限
 * @param {number}   M_  投注总额上限
 * @returns {object}
 *
 * 保证：M = sum(newWeights) ∈ [m_, M_]
 */
export function optimizeWeights(a, x = 0.01, m_ = 100, M_ = 1000) {
  const n = a.length
  if (n === 0) throw new Error('输入列表不能为空')
  if (a.some(v => v <= 0)) throw new Error('所有数必须为正数')
  if (m_ > M_) throw new Error(`投注总额下限 ${m_} 不能大于上限 ${M_}`)

  const totalProd = prod(a)
  const w = a.map(ai => totalProd / ai)

  let idxMin = 0
  for (let i = 1; i < n; i++) {
    if (w[i] < w[idxMin]) idxMin = i
  }
  const wMin = w[idxMin]
  const sumW = w.reduce((s, v) => s + v, 0)

  const candidates = []

  const tMin = Math.max(2, roundToEven((wMin * m_) / sumW) - 4)
  const tMax = roundToEven((wMin * M_) / sumW) + 8

  for (let t = tMin; t <= tMax; t += 2) {
    const scale = t / wMin
    let newW = w.map(wi => roundToEven(wi * scale))
    newW[idxMin] = t

    // 主动修正到 [m_, M_]
    newW = fixSum(newW, idxMin, m_, M_)

    const sumNew = newW.reduce((s, v) => s + v, 0)
    if (sumNew < m_ || sumNew > M_) continue

    const S = newW.map((wi, i) => wi * a[i])
    const M = sumNew
    const D = S.map(s => s - M)

    const meanD = D.reduce((s, v) => s + v, 0) / D.length

    // ★ 修复 1：跳过 meanD 接近 0 的候选（cv 会爆炸）
    if (Math.abs(meanD) < 1e-9) continue

    // ★ 修复 2：cv 用 |meanD|，恒非负
    const cv = D.length > 1 ? stdev(D) / Math.abs(meanD) : 0

    const rangeVal = Math.max(...D) - Math.min(...D)
    const rangeRatio = M !== 0 ? rangeVal / M : Infinity

    candidates.push({ t, newW, S, M, D, cv, rangeRatio })
  }

  if (candidates.length === 0) {
    throw new Error(`没有找到符合条件的候选方案（投注总额需在 ${m_} ~ ${M_} 之间）`)
  }

  // ★ 修复 3：minCv 也基于非负 cv
  const minCv = Math.min(...candidates.map(c => c.cv))

  const filtered = candidates.filter(c => c.cv <= minCv + x)
  const best = filtered.reduce((a, b) => (a.rangeRatio <= b.rangeRatio ? a : b))

  const finalM = best.newW.reduce((s, v) => s + v, 0)
  if (finalM < m_ || finalM > M_) {
    throw new Error(`最终投注总额 ${finalM} 超出范围 [${m_}, ${M_}]`)
  }

  return {
    idxMin,
    aMin: a[idxMin],
    minCv,
    threshold: minCv + x,
    candidatesCount: candidates.length,
    filteredCount: filtered.length,
    bestT: best.t,
    newWeights: best.newW,
    S: best.S,
    M: finalM,
    D: best.D,
    cv: best.cv,
    rangeRatio: best.rangeRatio
  }
}

/* ============================================================
 *  组合生成
 * ============================================================ */

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
        value: opt.value,
        // ★ 新增：让球标识
        poolType: row.poolType || 'had',
        poolLabel: row.poolLabel || '胜平负',
        goalLine: row.goalLine ?? 0
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

/* ============================================================
 *  完整计算流程
 * ============================================================ */

/**
 * @param {Array} rows
 * @param {object} options { x, m_, M_ }
 *
 * 严格保证：result.M ∈ [m_, M_]
 */
export function computeAll(rows, options = {}) {
  const { x = 0.01, m_ = 100, M_ = 1000 } = options

  const { a, texts, combos } = buildCombinations(rows)
  const exp = expect(a)

  let result = null
  let errorMsg = null
  try {
    result = optimizeWeights(a, x, m_, M_)

    // 双保险
    const M = result.newWeights.reduce((s, v) => s + v, 0)
    if (M < m_ || M > M_) {
      errorMsg = `投注总额 ${M} 超出范围 [${m_}, ${M_}]`
      result = null
    } else {
      result.M = M   // 确保 M 与实际求和一致
    }
  } catch (e) {
    errorMsg = e.message
  }

  let details = []
  if (result) {
    const { newWeights, D, M } = result
    details = newWeights.map((bet, i) => ({
      index: i,
      bet,
      text: texts[i],
      combo: combos[i],
      profit: D[i],
      rate: M !== 0 ? D[i] / M : 0
    }))
  }

  return {
    a,
    texts,
    combos,
    expect: exp,
    result,
    details,
    errorMsg
  }
}