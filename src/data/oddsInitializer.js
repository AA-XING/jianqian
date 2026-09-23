/**
 * 初始化模块
 *
 * 数据来源：竞彩网官方 API
 *   https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry
 *
 * 分两次请求：
 *   - poolCode=had   → 不让球胜平负
 *   - poolCode=hhad  → 让球胜平负
 *
 * ★ 同一场比赛的「不让球」与「让球」拆成两条独立记录
 * ★ 每条记录带 bettingSingle 标识（是否可投单关）
 *
 * ★ 硬保护：
 *   - 内存缓存：同一会话内，默认直接返回缓存
 *   - 最小间隔：距上次成功抓取不足 60 秒时，返回缓存而不发请求
 *   - force=true 时绕过缓存，但仍受最小间隔限制
 *
 * 返回结构：
 *   { matches: [...], fetchedAt: 1726896000000 }
 */

/* ============================================================
 *  备用数据
 * ============================================================ */

const FALLBACK_MATCHES = [
  // 周二001 —— 只有让球，可单关
  {
    id: '2041642-hhad',
    groupId: '2041642',
    poolType: 'hhad',
    poolLabel: '让-1',
    name: '韩国亚 vs 沙特亚',
    league: '亚运男足',
    kickoff: '2026-09-22 18:00',
    matchNo: '周二001',
    goalLine: -1,
    bettingSingle: true,
    odds: { win: 1.95, draw: 3.75, lose: 2.86 }
  },
  // 周二002 —— 两盘都有
  {
    id: '2041643-had',
    groupId: '2041643',
    poolType: 'had',
    poolLabel: '胜平负',
    name: '米尔顿 vs 克劳利',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二002',
    goalLine: 0,
    bettingSingle: false,
    odds: { win: 1.45, draw: 4.25, lose: 4.88 }
  },
  {
    id: '2041643-hhad',
    groupId: '2041643',
    poolType: 'hhad',
    poolLabel: '让-1',
    name: '米尔顿 vs 克劳利',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二002',
    goalLine: -1,
    bettingSingle: false,
    odds: { win: 2.35, draw: 3.70, lose: 2.31 }
  },
  // 周二003 —— had 可单关
  {
    id: '2041655-had',
    groupId: '2041655',
    poolType: 'had',
    poolLabel: '胜平负',
    name: '诺茨郡 vs 格里姆',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二003',
    goalLine: 0,
    bettingSingle: true,
    odds: { win: 2.08, draw: 3.45, lose: 2.79 }
  },
  {
    id: '2041655-hhad',
    groupId: '2041655',
    poolType: 'hhad',
    poolLabel: '让-1',
    name: '诺茨郡 vs 格里姆',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二003',
    goalLine: -1,
    bettingSingle: false,
    odds: { win: 4.20, draw: 3.88, lose: 1.58 }
  },
  // 周二004 —— 两盘都有
  {
    id: '2041644-had',
    groupId: '2041644',
    poolType: 'had',
    poolLabel: '胜平负',
    name: '维冈 vs 布莱克浦',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二004',
    goalLine: 0,
    bettingSingle: false,
    odds: { win: 2.10, draw: 3.50, lose: 2.72 }
  },
  {
    id: '2041644-hhad',
    groupId: '2041644',
    poolType: 'hhad',
    poolLabel: '让-1',
    name: '维冈 vs 布莱克浦',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二004',
    goalLine: -1,
    bettingSingle: false,
    odds: { win: 4.15, draw: 4.05, lose: 1.56 }
  }
]

/* ============================================================
 *  API 配置
 * ============================================================ */

const API_BASE = import.meta.env.DEV
  ? '/api/sporttery/gateway/jc/football/getMatchCalculatorV1.qry'
  : '/api/proxy'

/**
 * 构造 pool 请求 URL
 * - 本地开发：走 Vite 代理，直接拼 poolCode
 * - 线上部署：走 EdgeOne Functions，把真实 URL 作为 url 参数
 */
function buildPoolUrl(poolCode) {
  if (import.meta.env.DEV) {
    return `${API_BASE}?poolCode=${poolCode}&channel=c`
  }
  const target = `https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry?poolCode=${poolCode}&channel=c`
  return `${API_BASE}?url=${encodeURIComponent(target)}`
}

/* ============================================================
 *  ★ 硬保护：内存缓存 + 最小抓取间隔
 * ============================================================ */

/** 最小抓取间隔（毫秒）—— 60 秒 */
const MIN_FETCH_INTERVAL = 60 * 1000

/** 上次成功抓取的时间戳 */
let lastFetchSuccessAt = 0

/** 内存缓存（整个会话共享） */
let memoryCache = null

/* ============================================================
 *  工具
 * ============================================================ */

function num(v, fallback = 0) {
  const n = parseFloat(v)
  return Number.isNaN(n) ? fallback : n
}

function extractFlatList(json) {
  const list = json?.value?.matchInfoList || json?.value?.matchInfoListV1 || []
  const flat = []
  for (const day of list) {
    const sub = day.subMatchList || day.matchList || []
    for (const m of sub) flat.push(m)
  }
  return flat
}

function parseOdds(obj) {
  if (!obj || typeof obj !== 'object') return null
  const win = obj.h ?? obj.win ?? obj.w
  const draw = obj.d ?? obj.draw
  const lose = obj.a ?? obj.lose ?? obj.l

  if (win === undefined || draw === undefined || lose === undefined) return null
  const w = num(win), d = num(draw), l = num(lose)
  if (w === 0 && d === 0 && l === 0) return null
  return { win: w, draw: d, lose: l }
}

function parseGoalLine(obj) {
  if (!obj || typeof obj !== 'object') return -1
  const gl = obj.goalLine ?? obj.goal_line ?? obj.gl
  if (gl === undefined || gl === null || gl === '') return -1
  return num(gl, -1)
}

/** 格式化让球标签 */
function makePoolLabel(poolType, goalLine) {
  if (poolType === 'had') return '胜平负'
  return `让${goalLine}`
}

/**
 * 从 poolList 中读取指定 poolCode 的 single 字段
 * single = 1 → 可投单关
 */
function parseBettingSingle(match, targetPoolCode) {
  const poolList = match?.poolList || []
  for (const p of poolList) {
    if (
      String(p.poolCode).toUpperCase() === String(targetPoolCode).toUpperCase()
    ) {
      return Number(p.single) === 1
    }
  }
  return false
}

/* ============================================================
 *  请求
 * ============================================================ */

async function fetchPool(poolCode) {
  const url = buildPoolUrl(poolCode)
  console.log(`[init] 请求 pool=${poolCode}`, url)
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json()
    const flat = extractFlatList(json)
    console.log(`[init] pool=${poolCode} 比赛数:`, flat.length)
    return flat
  } catch (e) {
    console.error(`[init] pool=${poolCode} 异常:`, e)
    return []
  }
}

/* ============================================================
 *  内部：真正发起抓取
 * ============================================================ */

async function fetchFreshData() {
  const fetchedAt = Date.now()
  console.log('[init] 开始抓取...', new Date(fetchedAt).toLocaleString())

  const [hadList, hhadList] = await Promise.all([
    fetchPool('had'),
    fetchPool('hhad')
  ])

  if (!hadList.length && !hhadList.length) {
    console.warn('[init] 两个 pool 都为空，使用备用数据')
    return { matches: FALLBACK_MATCHES, fetchedAt }
  }

  const result = []

  function makeBase(m) {
    return {
      groupId: m.matchId,
      name: `${m.homeTeamAbbName || m.homeTeamAllName || ''} vs ${m.awayTeamAbbName || m.awayTeamAllName || ''}`,
      league: m.leagueAbbName || m.leagueAllName || '',
      kickoff: `${m.matchDate || ''} ${m.matchTime || ''}`.trim(),
      matchNo: m.matchNumStr || m.matchNum || ''
    }
  }

  // had 列表
  for (const m of hadList) {
    const odds = parseOdds(m.had)
    if (!odds) continue
    const base = makeBase(m)
    result.push({
      id: `${m.matchId}-had`,
      groupId: base.groupId,
      poolType: 'had',
      poolLabel: '胜平负',
      ...base,
      goalLine: 0,
      bettingSingle: parseBettingSingle(m, 'HAD'),
      odds
    })
  }

  // hhad 列表
  for (const m of hhadList) {
    const odds = parseOdds(m.hhad)
    if (!odds) continue
    const base = makeBase(m)
    const goalLine = parseGoalLine(m.hhad)
    result.push({
      id: `${m.matchId}-hhad`,
      groupId: base.groupId,
      poolType: 'hhad',
      poolLabel: makePoolLabel('hhad', goalLine),
      ...base,
      goalLine,
      bettingSingle: parseBettingSingle(m, 'HHAD'),
      odds
    })
  }

  console.log('[init] 合并后比赛数量:', result.length)
  result.slice(0, 6).forEach(m => {
    console.log(`[init] ${m.matchNo} ${m.id} ${m.poolLabel}`, {
      bettingSingle: m.bettingSingle,
      odds: m.odds
    })
  })

  if (!result.length) {
    console.warn('[init] 合并结果为空，使用备用数据')
    return { matches: FALLBACK_MATCHES, fetchedAt }
  }

  return { matches: result, fetchedAt }
}

/* ============================================================
 *  对外 API
 * ============================================================ */

/**
 * 初始化比赛数据
 *
 * @param {object} options
 *   - force: boolean  是否强制重新抓取（默认 false）
 *
 * 行为：
 *   1. force=false 且有缓存 → 直接返回缓存
 *   2. 距上次成功抓取不足 MIN_FETCH_INTERVAL → 返回缓存（若有）
 *   3. 否则真正发起抓取，成功后写缓存
 *   4. force=true 时绕过缓存，但仍受 MIN_FETCH_INTERVAL 限制
 *
 * @returns {Promise<{matches: Array, fetchedAt: number}>}
 */
export async function initializeOddsData({ force = false } = {}) {
  const now = Date.now()

  // ---------- 1. 非强制 + 有缓存 → 直接返回 ----------
  if (!force && memoryCache) {
    console.log('[init] 使用内存缓存（非强制）')
    return memoryCache
  }

  // ---------- 2. 距上次成功不足 MIN_FETCH_INTERVAL → 返回缓存 ----------
  if (lastFetchSuccessAt && now - lastFetchSuccessAt < MIN_FETCH_INTERVAL) {
    const remain = Math.ceil(
      (MIN_FETCH_INTERVAL - (now - lastFetchSuccessAt)) / 1000
    )
    console.warn(
      `[init] 距上次抓取不足 ${MIN_FETCH_INTERVAL / 1000} 秒（还剩 ${remain} 秒），使用缓存`
    )
    if (memoryCache) return memoryCache
  }

  // ---------- 3. 真正抓取 ----------
  try {
    const result = await fetchFreshData()
    lastFetchSuccessAt = Date.now()
    memoryCache = result
    console.log('[init] 抓取完成并写入缓存，fetchedAt =', result.fetchedAt)
    return result
  } catch (e) {
    console.error('[init] 抓取异常，尝试返回缓存:', e)
    if (memoryCache) return memoryCache
    return { matches: FALLBACK_MATCHES, fetchedAt: Date.now() }
  }
}

/* ============================================================
 *  调试工具
 * ============================================================ */

export function getRawMatches() {
  return JSON.parse(JSON.stringify(FALLBACK_MATCHES))
}

/** 清空缓存（仅供调试 / 测试用） */
export function clearCache() {
  memoryCache = null
  lastFetchSuccessAt = 0
  console.log('[init] 缓存已清空')
}

/** 查看缓存状态 */
export function getCacheStatus() {
  return {
    hasCache: !!memoryCache,
    lastFetchSuccessAt,
    nextAllowedAt: lastFetchSuccessAt + MIN_FETCH_INTERVAL,
    remainMs: Math.max(0, lastFetchSuccessAt + MIN_FETCH_INTERVAL - Date.now())
  }
}