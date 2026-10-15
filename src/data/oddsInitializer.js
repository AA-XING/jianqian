/**
 * 初始化模块 - 读取静态 matches.json
 *
 * 数据由 scripts/fetch-odds.mjs 定时生成，
 * 每次 build 前更新 public/matches.json。
 */

/* ============================================================
 *  备用数据（网络异常时使用）
 * ============================================================ */

const FALLBACK_MATCHES = [
  {
    id: '2041642-hhad',
    groupId: '2041642',
    poolType: 'hhad',
    poolLabel: '让-1',
    name: '获取 vs 数据失败',
    league: '亚运男足',
    kickoff: '2026-09-22 18:00',
    matchNo: '周二001',
    goalLine: -1,
    bettingSingle: true,
    odds: { win: 1.95, draw: 3.75, lose: 2.86 }
  },
  {
    id: '2041643-had',
    groupId: '2041643',
    poolType: 'had',
    poolLabel: '胜平负',
    name: '随机 vs 生成数据',
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
    name: '肖哥 vs 多多',
    league: '英锦标赛',
    kickoff: '2026-09-23 02:00',
    matchNo: '周二002',
    goalLine: -1,
    bettingSingle: false,
    odds: { win: 2.35, draw: 3.70, lose: 2.31 }
  }
]

/* ============================================================
 *  对外 API
 * ============================================================ */

let memoryCache = null

export async function initializeOddsData({ force = false } = {}) {
  // 非强制刷新时用缓存
  if (!force && memoryCache) {
    console.log('[init] 使用内存缓存')
    return memoryCache
  }

  console.log('[init] 读取静态 matches.json')

  try {
    // ★ 加时间戳防止 CDN / 浏览器缓存
    const res = await fetch(`/matches.json?t=${Date.now()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()

    if (!data?.matches?.length) {
      throw new Error('matches.json 为空')
    }

    console.log(
      '[init] 加载成功，比赛数:',
      data.matches.length,
      '更新时间:',
      new Date(data.fetchedAt).toLocaleString()
    )

    memoryCache = data
    return data
  } catch (e) {
    console.error('[init] 加载失败，使用备用数据:', e.message)
    const fallback = { matches: FALLBACK_MATCHES, fetchedAt: Date.now() }
    memoryCache = fallback
    return fallback
  }
}

/* ============================================================
 *  调试工具
 * ============================================================ */

export function getRawMatches() {
  return JSON.parse(JSON.stringify(FALLBACK_MATCHES))
}

export function clearCache() {
  memoryCache = null
  console.log('[init] 缓存已清空')
}

export function getCacheStatus() {
  return {
    hasCache: !!memoryCache,
    lastFetchSuccessAt: memoryCache?.fetchedAt || 0,
    nextAllowedAt: 0,
    remainMs: 0
  }
}