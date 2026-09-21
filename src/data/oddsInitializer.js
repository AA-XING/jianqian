/**
 * 初始化模块
 *
 * 数据来源：竞彩网官方 API
 *   https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry
 *
 * 通过 Vite 代理转发（避免 CORS）：
 *   /api/sporttery → https://webapi.sporttery.cn
 *
 * 关键约定：
 *   - 同一场比赛的「不让球」与「让球」赔率分开记录
 *   - hadOdds  = 不让球胜平负赔率 { win, draw, lose }
 *   - hhadOdds = 让球胜平负赔率   { win, draw, lose }
 *   - goalLine = 让球数（如 -1 表示主让 1 球）
 *
 * 返回结构：
 *   {
 *     matches: [...],       // 比赛数组
 *     fetchedAt: 1726896000000   // 抓取时间戳（毫秒）
 *   }
 */

/* ============================================================
 *  备用数据（网络失败时使用）
 * ============================================================ */

const FALLBACK_MATCHES = [
  {
    id: '2041643',
    name: '米尔顿 vs 克劳利',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二002',
    goalLine: -1,
    odds: { win: 1.45, draw: 4.25, lose: 4.88 },
    hhadOdds: { win: 2.35, draw: 3.70, lose: 2.31 }
  },
  {
    id: '2041655',
    name: '诺茨郡 vs 格里姆',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二003',
    goalLine: -1,
    odds: { win: 2.08, draw: 3.45, lose: 2.79 },
    hhadOdds: { win: 4.20, draw: 3.88, lose: 1.58 }
  },
  {
    id: '2041644',
    name: '维冈 vs 布莱克浦',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二004',
    goalLine: -1,
    odds: { win: 2.10, draw: 3.50, lose: 2.72 },
    hhadOdds: { win: 4.15, draw: 4.05, lose: 1.56 }
  }
]

/* ============================================================
 *  API 配置
 * ============================================================ */

const API_URL = '/api/sporttery/gateway/jc/football/getMatchCalculatorV1.qry'

/* ============================================================
 *  内部工具
 * ============================================================ */

/**
 * 安全解析数字
 */
function num(v, fallback = 0) {
  const n = parseFloat(v)
  return Number.isNaN(n) ? fallback : n
}

/**
 * 把 API 返回的单场比赛转换为应用内部结构
 */
function toAppMatch(m) {
  const had = m.had || {}
  const hhad = m.hhad || {}

  return {
    id: m.matchId,
    name: `${m.homeTeamAbbName || m.homeTeamAllName || ''} vs ${m.awayTeamAbbName || m.awayTeamAllName || ''}`,
    league: m.leagueAbbName || m.leagueAllName || '',
    kickoff: `${m.matchDate || ''} ${m.matchTime || ''}`.trim(),
    matchNo: m.matchNumStr || m.matchNum || '',
    goalLine: hhad.goalLine !== undefined ? num(hhad.goalLine, -1) : -1,

    // ★ 不让球胜平负
    odds: {
      win: num(had.h),
      draw: num(had.d),
      lose: num(had.a)
    },

    // ★ 让球胜平负（分开记录，可能为空）
    hhadOdds: hhad.h !== undefined
      ? {
          win: num(hhad.h),
          draw: num(hhad.d),
          lose: num(hhad.a)
        }
      : null
  }
}

/**
 * 从 API 原始 JSON 里提取比赛列表
 * 兼容多种可能的字段路径
 */
function extractMatchList(json) {
  return (
    json?.value?.matchInfoList ||
    json?.value?.matchInfoListV1 ||
    json?.data?.matchInfoList ||
    json?.matchInfoList ||
    []
  )
}

/* ============================================================
 *  对外 API
 * ============================================================ */

/**
 * 初始化比赛数据（异步，每次调用都会重新抓取）
 * @returns {Promise<{matches: Array, fetchedAt: number}>}
 */
export async function initializeOddsData() {
  const fetchedAt = Date.now()   // ★ 记录抓取时间
  console.log('[init] 开始抓取...', new Date(fetchedAt).toLocaleString())
  console.log('[init] API_URL =', API_URL)

  // ---------- 1. 发起请求 ----------
  let res
  try {
    res = await fetch(`${API_URL}?poolCode=had,hhad&channel=c`)
    console.log('[init] fetch 状态:', res.status, res.statusText)
  } catch (e) {
    console.error('[init] fetch 异常:', e)
    return { matches: FALLBACK_MATCHES, fetchedAt }
  }

  if (!res.ok) {
    console.warn('[init] HTTP 错误，使用备用数据')
    return { matches: FALLBACK_MATCHES, fetchedAt }
  }

  // ---------- 2. 解析 JSON ----------
  let json
  try {
    json = await res.json()
    console.log('[init] 原始 JSON:', json)
  } catch (e) {
    console.error('[init] JSON 解析失败:', e)
    return { matches: FALLBACK_MATCHES, fetchedAt }
  }

  // ---------- 3. 提取比赛列表 ----------
  const matchList = extractMatchList(json)
  console.log('[init] matchInfoList 长度:', matchList.length)

  if (!matchList.length) {
    console.warn('[init] 未找到比赛数据，使用备用数据')
    return { matches: FALLBACK_MATCHES, fetchedAt }
  }

  // ---------- 4. 转换为内部结构 ----------
  const matches = []
  for (const day of matchList) {
    const subList = day.subMatchList || day.matchList || []
    console.log(`[init] 日期 ${day.matchDate || day.date} 场次:`, subList.length)

    for (const m of subList) {
      const had = m.had || {}
      if (had.h === undefined) {
        console.warn('[init] 跳过无赔率的比赛:', m.matchId)
        continue
      }
      matches.push(toAppMatch(m))
    }
  }

  console.log('[init] 解析后比赛数量:', matches.length)

  if (!matches.length) {
    console.warn('[init] 解析结果为空，使用备用数据')
    return { matches: FALLBACK_MATCHES, fetchedAt }
  }

  return { matches, fetchedAt }
}

/**
 * 获取原始备用数据（调试用）
 */
export function getRawMatches() {
  return JSON.parse(JSON.stringify(FALLBACK_MATCHES))
}

/**
 * 按日期筛选备用数据
 */
export function getMatchesByDate(date) {
  return FALLBACK_MATCHES
    .filter(m => m.matchDate === date)
    .map(m => ({ ...m }))
}

/**
 * 按赛事筛选备用数据
 */
export function getMatchesByLeague(league) {
  return FALLBACK_MATCHES
    .filter(m => m.league === league)
    .map(m => ({ ...m }))
}