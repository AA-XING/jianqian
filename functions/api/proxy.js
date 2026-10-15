/**
 * Cloudflare Pages Functions - 竞彩网 API 代理
 *
 * 通过第三方 CORS 代理（allorigins.win）中转，
 * 绕过竞彩网对 Cloudflare 数据中心 IP 的 WAF 拦截。
 *
 * 访问路径：/api/proxy?url=<encoded target url>
 */

export async function onRequest(context) {
  const { request } = context
  const reqUrl = new URL(request.url)

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const target = reqUrl.searchParams.get('url')
  if (!target) {
    return jsonResponse({ error: '缺少 url 参数' }, 400)
  }

  // 白名单校验
  try {
    const t = new URL(target)
    if (!t.hostname.endsWith('sporttery.cn')) {
      return jsonResponse({ error: '域名不在白名单内' }, 403)
    }
  } catch {
    return jsonResponse({ error: 'url 格式不正确' }, 400)
  }

  // ★ 通过第三方 CORS 代理中转
  // allorigins.win 的出口 IP 不在竞彩网黑名单
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

  let apiRes
  try {
    apiRes = await fetch(proxyUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    })
    clearTimeout(timeoutId)
  } catch (e) {
    clearTimeout(timeoutId)
    return jsonResponse(
      {
        error: '转发失败',
        message: e.message,
        name: e.name,
        target
      },
      502
    )
  }

  const body = await apiRes.text()

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
      'Cache-Control': 'no-store'
    }
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400'
  }
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders()
    }
  })
}