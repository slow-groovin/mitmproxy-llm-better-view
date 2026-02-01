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
  logprobs?: any
}

export interface Delta {
  role?: string
  content?: string
  tool_calls?: ToolCallDelta[]
}

export interface ToolCallDelta {
  index: number
  id?: string
  type?: string
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
  }
}

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
  tool_calls: AggregatedToolCall[]
  finish_reason: string
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

export function parseSSEEvents(sseText: string): OpenAISSEEvent[] {
  const events: OpenAISSEEvent[] = []
  sseText.split('\n').forEach(line => {
    line = line.trim()
    if (line.startsWith('data: ')) {
      const dataContent = line.slice(6)
      if (dataContent === '[DONE]') return
      try {
        events.push(JSON.parse(dataContent))
      } catch {}
    }
  })
  return events
}

export function transferSSEToNormal(sseText: string): SSEResponseData {
  const events = parseSSEEvents(sseText)
  return processSSEEvents(events)
}

function processSSEEvents(events: OpenAISSEEvent[]): SSEResponseData {
  if (!events.length) {
    throw new Error("No events to process")
  }

  const finalEvent = events.find((event) => event.usage) || events[events.length - 1]
  const aggregatedChoices = aggregateChoices(events)

  return {
    id: finalEvent.id || "N/A",
    object: finalEvent.object || "N/A",
    created: finalEvent.created || 0,
    model: finalEvent.model || "N/A",
    system_fingerprint: finalEvent.system_fingerprint,
    choices: aggregatedChoices,
    usage: finalEvent.usage,
    eventCount: events.length,
  }
}

function aggregateChoices(events: OpenAISSEEvent[]): AggregatedChoice[] {
  const choiceMap = new Map<number, {
    index: number
    role: string
    content: string
    tool_calls: Map<number, AggregatedToolCall>
    finish_reason: string
  }>()

  for (const event of events) {
    if (!event.choices) continue
    for (const choice of event.choices) {
      const index = choice.index
      if (!choiceMap.has(index)) {
        choiceMap.set(index, {
          index,
          role: "N/A",
          content: "",
          tool_calls: new Map<number, AggregatedToolCall>(),
          finish_reason: "N/A",
        })
      }
      const agg = choiceMap.get(index)!
      const delta = choice.delta
      if (delta) {
        if (delta.role) agg.role = delta.role
        if (delta.content) agg.content += delta.content
        if (delta.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            const toolIndex = toolCallDelta.index
            if (!agg.tool_calls.has(toolIndex)) {
              agg.tool_calls.set(toolIndex, {
                index: toolIndex,
                id: "N/A",
                type: "N/A",
                function: { name: "N/A", arguments: "" },
              })
            }
            const toolCall = agg.tool_calls.get(toolIndex)!
            if (toolCallDelta.id) toolCall.id = toolCallDelta.id
            if (toolCallDelta.type) toolCall.type = toolCallDelta.type
            if (toolCallDelta.function?.name) toolCall.function.name = toolCallDelta.function.name
            if (toolCallDelta.function?.arguments) {
              toolCall.function.arguments += toolCallDelta.function.arguments
            }
          }
        }
      }
      if (choice.finish_reason) {
        agg.finish_reason = choice.finish_reason
      }
    }
  }

  return Array.from(choiceMap.values()).map(agg => ({
    index: agg.index,
    role: agg.role,
    content: agg.content,
    tool_calls: Array.from(agg.tool_calls.values()).sort((a, b) => a.index - b.index),
    finish_reason: agg.finish_reason,
  })).sort((a, b) => a.index - b.index)
}
