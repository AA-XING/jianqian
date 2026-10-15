/**
 * Cloudflare Pages Functions - 竞彩网 API 代理
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

  try {
    const t = new URL(target)
    if (!t.hostname.endsWith('sporttery.cn')) {
      return jsonResponse({ error: '域名不在白名单内' }, 403)
    }
  } catch {
    return jsonResponse({ error: 'url 格式不正确' }, 400)
  }

  // ★ 带超时的 fetch
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  let apiRes
  try {
    apiRes = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.sporttery.cn/',
        'Accept': 'application/json, text/plain, */*'
      },
      signal: controller.signal
    })
    clearTimeout(timeoutId)
  } catch (e) {
    clearTimeout(timeoutId)
    // ★ 明确区分超时 / SSL / DNS 等错误
    return jsonResponse({
      error: '转发失败',
      message: e.message,
      name: e.name,
      target
    }, 502)
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