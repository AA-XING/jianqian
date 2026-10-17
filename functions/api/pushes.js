/**
 * 推单
 * POST /api/pushes     保存推单
 * GET  /api/pushes     获取列表
 */

export async function onRequestGet(context) {
  const { env } = context
  try {
    const list = await env.PUSHES_KV.get('list', 'json')
    return jsonResponse({ ok: true, list: list || [] })
  } catch (e) {
    return jsonResponse({ ok: true, list: [] })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  let body
  try {
    body = await request.json()
  } catch (e) {
    return jsonResponse({ error: 'JSON 格式错误' }, 400)
  }

  if (!body?.result) {
    return jsonResponse({ error: '缺少 result 数据' }, 400)
  }

  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    savedAt: Date.now(),
    remark: (body.remark || '').slice(0, 200),
    result: body.result,
    copyText: (body.copyText || '').slice(0, 2000),
    parlayItems: body.parlayItems || [],
    comboRows: body.comboRows || [],
    status: 'pushed',
    pickedComboIndex: null,
    loseAll: false,
    deleted: false 
  }

  try {
    let list = (await env.PUSHES_KV.get('list', 'json')) || []
    list.unshift(item)
    if (list.length > 300) list = list.slice(0, 300)
    await env.PUSHES_KV.put('list', JSON.stringify(list))
  } catch (e) {
    return jsonResponse({ error: '保存失败: ' + e.message }, 500)
  }

  return jsonResponse({ ok: true, id: item.id })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function onRequestPut(context) {
  const { request, env } = context
  const reqUrl = new URL(request.url)
  const id = reqUrl.searchParams.get('id')
  if (!id) return jsonResponse({ error: '缺少 id' }, 400)

  let body
  try {
    body = await request.json()
  } catch (e) {
    return jsonResponse({ error: 'JSON 格式错误' }, 400)
  }

  try {
    let list = (await env.PUSHES_KV.get('list', 'json')) || []
    const idx = list.findIndex(s => s.id === id)
    if (idx === -1) {
      return jsonResponse({ error: '方案不存在' }, 404)
    }

    // 允许更新的字段（白名单）
    const allowed = ['status', 'pickedComboIndex', 'loseAll', 'deleted', 'remark']
    for (const k of allowed) {
      if (body[k] !== undefined) {
        list[idx][k] = body[k]
      }
    }

    await env.PUSHES_KV.put('list', JSON.stringify(list))
    return jsonResponse({ ok: true, item: list[idx] })
  } catch (e) {
    return jsonResponse({ error: '更新失败: ' + e.message }, 500)
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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