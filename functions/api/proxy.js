/**
 * EdgeOne Pages Functions - 竞彩网 API 代理
 *
 * 访问路径：/api/proxy?url=<encoded target url>
 *
 * 作用：
 *   1. 转发请求到 webapi.sporttery.cn
 *   2. 添加 CORS 头，让浏览器可以跨域访问
 *   3. 伪装 User-Agent / Referer，避免被 WAF 拦截
 */

export async function onRequest(context) {
  const { request } = context
  const reqUrl = new URL(request.url)

  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    })
  }

  // 取目标 URL
  const target = reqUrl.searchParams.get('url')
  if (!target) {
    return jsonResponse({ error: '缺少 url 参数' }, 400)
  }

  // 白名单校验（防止被滥用为开放代理）
  try {
    const targetUrl = new URL(target)
    if (!targetUrl.hostname.endsWith('sporttery.cn')) {
      return jsonResponse({ error: '域名不在白名单内' }, 403)
    }
  } catch (e) {
    return jsonResponse({ error: 'url 参数格式不正确' }, 400)
  }

  // 转发请求
  let apiRes
  try {
    apiRes = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.sporttery.cn/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    })
  } catch (e) {
    return jsonResponse({ error: '转发失败: ' + e.message }, 502)
  }

  // 构造响应
  const body = await apiRes.text()
  return new Response(body, {
    status: apiRes.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders()
    }
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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