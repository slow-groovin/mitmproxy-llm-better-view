

// --- 辅助函数 ---

import { Flow } from "../types/flow"
import { isOpenaiResponseRequest, isOpenaiResponsesPath } from "../types/openai-response/response-request"
import { isOpenaiResponse } from "../types/openai-response/response-response"

export function isJson(flow: Flow): boolean {
  return flow.response.headers.some(h => {
    const [key, value] = h
    return key.toLowerCase() === 'content-type' && value.includes('application/json')
  })
}

export function isSSE(flow: Flow): boolean {
  return flow.response.headers.some(h => {
    const [key, value] = h
    return key.toLowerCase() === 'content-type' && value.includes('text/event-stream')
  })
}

function parseDataText(text: string): any | null {
  try {
    // 兼容处理 buffer 或 string
    return typeof text === 'string' ? JSON.parse(text) : text
  } catch {
    return null
  }
}

// --- OpenAI Detection ---

function isOpenAIChatRequestPath(flow: Flow): boolean {
  const path = flow.request.path
  return (
    path.endsWith('/completions') ||
    path.includes('/chat/completions')
  )
}

function isOpenAIResponsePath(flow: Flow): boolean {
  const path = flow.request.path
  // 当前 response/sse 渲染仍是 chat-completions 结构，避免误判到 responses。
  return path.endsWith('/completions') || path.includes('/chat/completions')
}

function isOpenAIBody(parsedObj: any): boolean {
  // 宽松检查：OpenAI 及其兼容接口通常包含 model
  return parsedObj && typeof parsedObj === 'object' && 'model' in parsedObj
}

export function isOpenAIReq(action: 'request' | 'response', data: string, flow: Flow): boolean {
  if (action !== 'request' || !isOpenAIChatRequestPath(flow)) return false
  const body = parseDataText(data)
  // OpenAI 请求体通常包含 messages (Chat) 或 prompt (Legacy)
  const isChatLikeRequest = Array.isArray(body?.messages) || typeof body?.prompt !== 'undefined'
  return isOpenAIBody(body) && isChatLikeRequest
}

/**
 * OpenAI Responses API request 独立识别，不与 chat/completions 混用。
 */
export function isOpenAIResponsesReq(action: 'request' | 'response', data: string, flow: Flow): boolean {
  if (action !== 'request' || !isOpenaiResponsesPath(flow.request.path)) return false
  const body = parseDataText(data)
  return isOpenaiResponseRequest(body)
}

/**
 * OpenAI Responses API response 独立识别，支持 JSON 与 SSE。
 */
export function isOpenAIResponsesRes(action: 'request' | 'response', data: string, flow: Flow): boolean {
  if (action !== 'response' || !isOpenaiResponsesPath(flow.request.path)) return false
  if (isSSE(flow)) return true

  if (isJson(flow)) {
    const body = parseDataText(data)
    if (!body) return false
    // 兼容可能的包装体：{ response: {...} }
    if (isOpenaiResponse(body)) return true
    if (body?.response && isOpenaiResponse(body.response)) return true
  }
  return false
}

export function isOpenAIRes(action: 'request' | 'response', data: string, flow: Flow): boolean {
  if (action !== 'response' || !isOpenAIResponsePath(flow)) return false
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

export function isAnthropicReq(action: 'request' | 'response', data: string, flow: Flow): boolean {
  if (action !== 'request' || !isAnthropicPath(flow)) return false
  const body = parseDataText(data)
  // Claude 请求体包含 model 和 messages (或 prompt)
  return body && body.model && (body.messages || body.prompt)
}

export function isAnthropicRes(action: 'request' | 'response', data: string, flow: Flow): boolean {
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

/**
 * 检查请求路径是否包含 Gemini API 特征
 * 识别官方 endpoint (generateContent) 或包含 gemini 关键字的自定义路径
 */
function isGeminiPath(flow: Flow): boolean {
  const path = flow.request.path.toLowerCase()
  // 识别 generateContent 或 streamGenerateContent, 或者包含 gemini 关键字的路径
  return path.includes(':generatecontent') ||
    path.includes(':streamgeneratecontent') ||
    path.includes('gemini')
}

/**
 * 判断是否为 Gemini 请求
 * 结合路径特征和请求体结构 (contents 数组) 进行识别
 */
export function isGeminiReq(action: 'request' | 'response', data: string, flow: Flow): boolean {
  if (action !== 'request') return false
  const body = parseDataText(data)
  if (!body) return false

  // Gemini 请求体特征：包含 contents 数组，且元素通常包含 parts
  const hasGeminiStructure = Array.isArray(body.contents) &&
    (body.contents.length === 0 || body.contents.some((c: any) => c && (c.parts || c.role)))

  // 兼容 /v1internal 等包装格式：{ request: { contents: [...] } }。
  const wrappedRequest = body?.request
  const hasWrappedGeminiStructure =
    wrappedRequest &&
    typeof wrappedRequest === 'object' &&
    !Array.isArray(wrappedRequest) &&
    !('content' in body) &&
    Array.isArray((wrappedRequest as any).contents)

  return isGeminiPath(flow) || hasGeminiStructure || hasWrappedGeminiStructure
}

/**
 * 判断是否为 Gemini 响应
 * 识别标准 JSON 响应 (包含 candidates) 或 SSE 流
 * 注：目前对响应的识别较为依赖路径特征以减少误判
 */
export function isGeminiRes(action: 'request' | 'response', data: string, flow: Flow): boolean {
  if (action !== 'response') return false
  if (isSSE(flow) && isGeminiPath(flow)) return true;
  const body = parseDataText(data)

  if (!body) return false

  // Gemini 响应体特征：包含 candidates 数组
  const hasCandidates = (b: any) => {
    if (Array.isArray(b)) return b.some(item => item && item.candidates)
    return b && b.candidates
  }

  // 兼容内部包装格式：{ response: { candidates: [...] } }。
  const wrappedResponse = body?.response
  const hasWrappedCandidates =
    wrappedResponse &&
    typeof wrappedResponse === 'object' &&
    !Array.isArray(wrappedResponse) &&
    hasCandidates(wrappedResponse)

  return isGeminiPath(flow) || hasCandidates(body) || hasWrappedCandidates
}
