import { Flow } from '../lib/pipeline'

// --- 辅助函数 ---

function isJson(flow: Flow): boolean {
  return flow.response.headers.some(h => {
    const [key, value] = h
    return key.toLowerCase() === 'content-type' && value.includes('application/json')
  })
}

function isSSE(flow: Flow): boolean {
  return flow.response.headers.some(h => {
    const [key, value] = h
    return key.toLowerCase() === 'content-type' && value.includes('text/event-stream')
  })
}

function parseDataText(data: any): any | null {
  try {
    // 兼容处理 buffer 或 string
    const text = typeof data === 'string' ? data : (data.text || data.toString('utf-8'))
    return typeof text === 'string' ? JSON.parse(text) : data
  } catch {
    return null
  }
}

// --- OpenAI Detection ---

function isOpenAIPath(flow: Flow): boolean {
  const path = flow.request.path
  // 覆盖 /v1/completions, /v1/chat/completions, 以及 Azure 的 /openai/deployments/...
  return (path.endsWith('/completions') || path.includes('/chat/completions')) &&
    (path.includes('/api/') || path.includes('/v1/') || path.includes('/openai/'))
}

function isOpenAIBody(parsedObj: any): boolean {
  // 宽松检查：OpenAI 及其兼容接口通常包含 model
  return parsedObj && typeof parsedObj === 'object' && 'model' in parsedObj
}

export function isOpenAIReq(action: 'request' | 'response', data: any, flow: Flow): boolean {
  if (action !== 'request' || !isOpenAIPath(flow)) return false
  const body = parseDataText(data)
  // OpenAI 请求体通常包含 messages (Chat) 或 prompt (Legacy)
  return isOpenAIBody(body) && (Array.isArray(body.messages) || typeof body.prompt !== 'undefined')
}

export function isOpenAIRes(action: 'request' | 'response', data: any, flow: Flow): boolean {
  if (action !== 'response' || !isOpenAIPath(flow)) return false
  if (isSSE(flow)) return true // OpenAI SSE

  if (isJson(flow)) {
    const body = parseDataText(data)
    // OpenAI 响应体包含 choices
    return isOpenAIBody(body) && Array.isArray(body.choices)
  }
  return false
}

// --- Anthropic (Claude) Detection ---

function isAnthropicPath(flow: Flow): boolean {
  const path = flow.request.path
  return path.includes('/v1/messages') || path.includes('/v1/complete') // complete 是旧版
}

export function isAnthropicReq(action: 'request' | 'response', data: any, flow: Flow): boolean {
  if (action !== 'request' || !isAnthropicPath(flow)) return false
  const body = parseDataText(data)
  // Claude 请求体包含 model 和 messages (或 prompt)
  return body && body.model && (body.messages || body.prompt)
}

export function isAnthropicRes(action: 'request' | 'response', data: any, flow: Flow): boolean {
  if (action !== 'response' || !isAnthropicPath(flow)) return false
  if (isSSE(flow)) return true

  if (isJson(flow)) {
    const body = parseDataText(data)
    // Claude Messages API 响应包含 type: 'message' 和 content 数组
    return body && (body.type === 'message' || body.completion)
  }
  return false
}

// --- Google (Gemini/Vertex AI) Detection ---

function isGeminiPath(flow: Flow): boolean {
  const path = flow.request.path
  // 识别 generateContent 或 streamGenerateContent
  return path.includes(':generateContent') || path.includes(':streamGenerateContent')
}

export function isGeminiReq(action: 'request' | 'response', data: any, flow: Flow): boolean {
  if (action !== 'request' || !isGeminiPath(flow)) return false
  const body = parseDataText(data)
  // Gemini 请求体包含 contents 数组
  return body && Array.isArray(body.contents)
}

export function isGeminiRes(action: 'request' | 'response', data: any, flow: Flow): boolean {
  if (action !== 'response' || !isGeminiPath(flow)) return false
  // Gemini 流式响应通常也是 application/json (Chunked) 或者 SSE，视具体客户端实现而定
  // 但原生 API 返回的是 JSON 数组或连续的 JSON 对象
  if (isJson(flow)) {
    const body = parseDataText(data)
    // Gemini 响应包含 candidates
    return body && (Array.isArray(body.candidates) || (Array.isArray(body) && body[0]?.candidates))
  }
  return false
}