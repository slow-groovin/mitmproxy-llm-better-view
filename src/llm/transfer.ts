// --- Interfaces ---

export interface OpenAISSEEvent {
  id?: string
  object?: string
  created?: number
  model?: string
  system_fingerprint?: string
  choices?: Choice[]
  usage?: Usage
}

export interface Choice {
  index: number
  delta?: Delta
  finish_reason?: string | null
  logprobs?: Logprobs | null
}

export interface Logprobs {
  content: Array<{
    token: string
    logprob: number
    bytes: number | null
    top_logprobs: Array<{
      token: string
      logprob: number
      bytes: number | null
    }>
  }> | null
}

export interface Delta {
  role?: string
  content?: string | null
  refusal?: string | null // OpenAI 新增字段
  tool_calls?: ToolCallDelta[]
}

export interface ToolCallDelta {
  index: number
  id?: string
  type?: 'function'
  function?: {
    name?: string
    arguments?: string
  }
}

export interface Usage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  prompt_tokens_details?: {
    cached_tokens?: number
    audio_tokens?: number
  }
  completion_tokens_details?: {
    reasoning_tokens?: number
    audio_tokens?: number
    accepted_prediction_tokens?: number
    rejected_prediction_tokens?: number
  }
}

// 聚合后的数据结构
export interface SSEResponseData {
  id: string
  object: string
  created: number
  model: string
  system_fingerprint?: string
  choices: AggregatedChoice[]
  usage?: Usage
  eventCount: number
}

export interface AggregatedChoice {
  index: number
  role: string
  content: string
  refusal?: string
  tool_calls: AggregatedToolCall[]
  finish_reason: string
  logprobs?: Logprobs | null
}

export interface AggregatedToolCall {
  index: number
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

// --- SSE Parsing Logic ---

export function parseSSEEvents(sseText: string): OpenAISSEEvent[] {
  const events: OpenAISSEEvent[] = []
  // 规范化换行符并按双换行分割（标准 SSE 块分隔符）
  // 注意：有些非标实现可能只用单换行，如果发现解析结果为空，可以回退策略
  let blocks = sseText.replace(/\r\n/g, '\n').split('\n\n')
  
  // 回退策略：如果 split('\n\n') 后只有一个块且很大，可能是非标流，尝试按行处理
  if (blocks.length === 1 && blocks[0].length > 100) {
     const lines = sseText.split('\n');
     blocks = [];
     let currentBlock = '';
     for (const line of lines) {
         if (line.trim() === '') {
             if (currentBlock) blocks.push(currentBlock);
             currentBlock = '';
         } else {
             currentBlock += line + '\n';
         }
     }
     if (currentBlock) blocks.push(currentBlock);
  }

  for (const block of blocks) {
    const lines = block.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataContent = line.slice(6).trim()
        if (dataContent === '[DONE]') continue
        try {
          // 处理可能包含在 data 后的 JSON
          events.push(JSON.parse(dataContent))
        } catch (e) {
          // 忽略解析失败的行（可能是 keep-alive 注释等）
        }
      }
    }
  }
  return events
}

export function transferSSEToNormal(sseText: string): SSEResponseData {
  const events = parseSSEEvents(sseText)
  if (!events.length) {
    // 可能是空响应或非 SSE 格式，返回一个空结构防止崩溃
    return {
        id: "error-empty-sse",
        object: "error",
        created: Date.now(),
        model: "unknown",
        choices: [],
        eventCount: 0
    }
  }
  return processSSEEvents(events)
}

function processSSEEvents(events: OpenAISSEEvent[]): SSEResponseData {
  // 查找包含 usage 的事件（通常是最后一个，但也可能在中间，如 Azure）
  // 优先找有 usage 的，否则找最后一个有效的
  const finalEvent = events.find((e) => e.usage) || events[events.length - 1] || {}
  
  // 查找任何一个包含基本元数据的事件
  const metaEvent = events.find(e => e.id && e.model) || finalEvent

  const aggregatedChoices = aggregateChoices(events)

  return {
    id: metaEvent.id || "N/A",
    object: "chat.completion", // 聚合后变为普通 completion 对象
    created: metaEvent.created || Math.floor(Date.now() / 1000),
    model: metaEvent.model || "N/A",
    system_fingerprint: metaEvent.system_fingerprint,
    choices: aggregatedChoices,
    usage: finalEvent.usage, // Usage 通常只在最后一个 chunk 出现
    eventCount: events.length,
  }
}

function aggregateChoices(events: OpenAISSEEvent[]): AggregatedChoice[] {
  const choiceMap = new Map<number, {
    index: number
    role: string
    content: string
    refusal: string
    tool_calls: Map<number, AggregatedToolCall>
    finish_reason: string
    logprobs: Logprobs | null
  }>()

  for (const event of events) {
    if (!event.choices) continue
    for (const choice of event.choices) {
      const index = choice.index
      
      // 初始化
      if (!choiceMap.has(index)) {
        choiceMap.set(index, {
          index,
          role: "assistant", // 默认为 assistant，防止首包无 role
          content: "",
          refusal: "",
          tool_calls: new Map<number, AggregatedToolCall>(),
          finish_reason: "", // 默认为空字符串
          logprobs: null
        })
      }
      
      const agg = choiceMap.get(index)!
      const delta = choice.delta

      if (delta) {
        if (delta.role) agg.role = delta.role
        if (delta.content) agg.content += delta.content
        if (delta.refusal) agg.refusal += delta.refusal
        
        if (delta.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            const toolIndex = toolCallDelta.index
            
            if (!agg.tool_calls.has(toolIndex)) {
              agg.tool_calls.set(toolIndex, {
                index: toolIndex,
                id: "", // 初始为空
                type: "",
                function: { name: "", arguments: "" },
              })
            }
            
            const toolCall = agg.tool_calls.get(toolIndex)!
            if (toolCallDelta.id) toolCall.id = toolCallDelta.id
            if (toolCallDelta.type) toolCall.type = toolCallDelta.type
            if (toolCallDelta.function?.name) toolCall.function.name += toolCallDelta.function.name
            if (toolCallDelta.function?.arguments) {
              toolCall.function.arguments += toolCallDelta.function.arguments
            }
          }
        }
      }
      
      if (choice.finish_reason) {
        agg.finish_reason = choice.finish_reason
      }
      // Logprobs 通常不会增量发送，而是覆盖或追加，这里假设简单覆盖或取最后
      if (choice.logprobs) {
        agg.logprobs = choice.logprobs
      }
    }
  }

  return Array.from(choiceMap.values()).map(agg => ({
    index: agg.index,
    role: agg.role,
    content: agg.content,
    refusal: agg.refusal || undefined, // 如果为空则移除
    tool_calls: Array.from(agg.tool_calls.values()).sort((a, b) => a.index - b.index),
    finish_reason: agg.finish_reason || "stop", // 兜底 finish_reason
    logprobs: agg.logprobs
  })).sort((a, b) => a.index - b.index)
}