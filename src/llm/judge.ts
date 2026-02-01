import { Flow } from '../lib/pipeline'

function isOpenAICompletionPath(flow: Flow): boolean {
  const path = flow.request.path
  return path.endsWith('/completions') && path.includes('/api/')
}

function isJson(flow: Flow): boolean {
  return flow.response.headers.some(h => {
    const key = Object.keys(h)[0]
    return key.toLowerCase() === 'content-type' && h[key].includes('application/json')
  })
}

function isSSE(flow: Flow): boolean {
  return flow.response.headers.some(h => {
    const key = Object.keys(h)[0]
    return key.toLowerCase() === 'content-type' && h[key].includes('text/event-stream')
  })
}

function parseDataText(data: any): any | null {
  try {
    return typeof data.text === 'string' ? JSON.parse(data.text) : data
  } catch {
    return null
  }
}

function isOpenAIBody(parsedObj: any): boolean {
  return parsedObj && parsedObj.model
}

function isOpenAIRequestBody(parsedObj: any): boolean {
  return isOpenAIBody(parsedObj) && (parsedObj.messages || parsedObj.prompt)
}

function isOpenAIResponseBody(parsedObj: any): boolean {
  return isOpenAIBody(parsedObj) && parsedObj.choices
}

export function isOpenAICompletionReq(action: 'request' | 'response', data: any, flow: Flow): boolean {
  return action === 'request' && isOpenAICompletionPath(flow) && isOpenAIRequestBody(parseDataText(data))
}

export function isOpenAICompletionRes(action: 'request' | 'response', data: any, flow: Flow): boolean {
  if (action !== 'response' || !isOpenAICompletionPath(flow)) {
    return false
  }
  
  if (isSSE(flow)) {
    return true
  }
  
  if (isJson(flow)) {
    return isOpenAIResponseBody(parseDataText(data))
  }
  
  return false
}
