import type {
  OpenaiChatCompletionChunk,
  OpenaiParsedSSEChunk,
} from '../../types/openai/chat-sse';
import type {
  OpenaiChatResponse,
  Choice,
  ChoiceMessage,
} from '../../types/openai/chat-response';
import type { ToolCall } from '../../types/openai/common';

/**
 * Parse SSE text string into OpenaiChatCompletionChunk array
 */
export function parseSSEEvents(sseText: string): OpenaiChatCompletionChunk[] {
  const events: OpenaiChatCompletionChunk[] = [];

  // Normalize line endings and split by double newline (standard SSE block separator)
  let blocks = sseText.replace(/\r\n/g, '\n').split('\n\n');

  // Fallback: if split('\n\n') results in only one large block, might be non-standard stream
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
    const lines = block.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataContent = line.slice(6).trim();
        if (dataContent === '[DONE]') continue;
        try {
          events.push(JSON.parse(dataContent));
        } catch (e) {
          // Ignore parse errors (might be keep-alive comments, etc.)
        }
      }
    }
  }
  return events;
}

/**
 * Parse SSE text string into parsed chunk array
 */
export function parseSSEChunks(sseText: string): OpenaiParsedSSEChunk[] {
  const chunks: OpenaiParsedSSEChunk[] = [];

  // Normalize line endings
  let blocks = sseText.replace(/\r\n/g, '\n').split('\n\n');

  // Fallback for non-standard stream
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
    const lines = block.split('\n');
    // const eventMatch = lines.find(l => l.startsWith('event: '))?.slice(7).trim(); // TODO: might be useful for Claude/Gemini
    const dataMatch = lines.find(l => l.startsWith('data: '));

    if (!dataMatch) continue;

    const dataContent = dataMatch.slice(6).trim();

    if (dataContent === '[DONE]') {
      chunks.push({
        type: 'done',
        data: null,
        raw: block,
        timestamp: Date.now(),
      });
      continue;
    }

    try {
      const data = JSON.parse(dataContent) as OpenaiChatCompletionChunk;
      chunks.push({
        type: 'chunk',
        data,
        raw: block,
        timestamp: Date.now(),
      });
    } catch (e) {
      chunks.push({
        type: 'error',
        data: null,
        raw: block,
        timestamp: Date.now(),
      });
    }
  }

  return chunks;
}

/**
 * Internal aggregation state for a single choice
 */
interface AggregatedChoiceState {
  index: number;
  role: 'assistant';
  content: string;
  refusal: string;
  toolCalls: Map<number, AggregatedToolCallState>;
  finishReason: string | null;
}

/**
 * Internal aggregation state for a tool call
 */
interface AggregatedToolCallState {
  index: number;
  id: string;
  type: string;
  functionName: string;
  functionArguments: string;
}

/**
 * Aggregate OpenAI Chat SSE chunks into a complete response
 */
export function aggregateSSEToResponse(sseText: string): OpenaiChatResponse {
  const events = parseSSEEvents(sseText);

  if (!events.length) {
    return createEmptyResponse();
  }

  return processSSEEvents(events);
}

/**
 * Aggregate from OpenaiParsedSSEChunk array
 */
export function aggregateChunksToResponse(chunks: OpenaiParsedSSEChunk[]): OpenaiChatResponse {
  const events = chunks
    .filter(c => c.type === 'chunk' && c.data !== null)
    .map(c => c.data!);

  if (!events.length) {
    return createEmptyResponse();
  }

  return processSSEEvents(events);
}

/**
 * Process SSE events into a response
 */
function processSSEEvents(events: OpenaiChatCompletionChunk[]): OpenaiChatResponse {
  // Find the final event with usage (usually the last one)
  const finalEvent = events.find(e => e.usage) || events[events.length - 1];

  // Find any event with basic metadata
  const metaEvent = events.find(e => e.id && e.model) || finalEvent;

  const aggregatedChoices = aggregateChoices(events);

  return {
    id: metaEvent.id || 'unknown',
    object: 'chat.completion',
    created: metaEvent.created || Math.floor(Date.now() / 1000),
    model: metaEvent.model || 'unknown',
    system_fingerprint: metaEvent.system_fingerprint ?? null,
    choices: aggregatedChoices,
    usage: finalEvent.usage ?? undefined,
  };
}

/**
 * Aggregate choices from SSE events
 */
function aggregateChoices(events: OpenaiChatCompletionChunk[]): Choice[] {
  const choiceMap = new Map<number, AggregatedChoiceState>();

  for (const event of events) {
    if (!event.choices) continue;

    for (const choice of event.choices) {
      const index = choice.index;

      // Initialize
      if (!choiceMap.has(index)) {
        choiceMap.set(index, {
          index,
          role: 'assistant',
          content: '',
          refusal: '',
          toolCalls: new Map(),
          finishReason: null,
        });
      }

      const agg = choiceMap.get(index)!;
      const delta = choice.delta;

      if (delta) {
        if (delta.role === 'assistant') agg.role = delta.role;
        if (delta.content) agg.content += delta.content;
        if (delta.tool_calls) {
          aggregateToolCalls(agg.toolCalls, delta.tool_calls);
        }
      }

      if (choice.finish_reason) {
        agg.finishReason = choice.finish_reason;
      }
    }
  }

  return Array.from(choiceMap.values())
    .map(agg => convertToChoice(agg))
    .sort((a, b) => a.index - b.index);
}

/**
 * Aggregate tool calls from delta
 */
function aggregateToolCalls(
  toolCallMap: Map<number, AggregatedToolCallState>,
  toolCallDeltas: ToolCall[]
): void {
  for (const toolCallDelta of toolCallDeltas) {
    const index = toolCallDelta.index ?? 0;

    if (!toolCallMap.has(index)) {
      toolCallMap.set(index, {
        index,
        id: toolCallDelta.id || '',
        type: toolCallDelta.type,
        functionName: toolCallDelta.function.name || '',
        functionArguments: toolCallDelta.function.arguments || '',
      });
    } else {
      const existing = toolCallMap.get(index)!;
      if (toolCallDelta.id) existing.id = toolCallDelta.id;
      if (toolCallDelta.type) existing.type = toolCallDelta.type;
      if (toolCallDelta.function.name) existing.functionName += toolCallDelta.function.name;
      if (toolCallDelta.function.arguments) existing.functionArguments += toolCallDelta.function.arguments;
    }
  }
}

/**
 * Convert aggregated state to Choice
 */
function convertToChoice(agg: AggregatedChoiceState): Choice {
  const toolCalls: ToolCall[] = Array.from(agg.toolCalls.values())
    .map(state => ({
      id: state.id,
      type: 'function' as const,
      function: {
        name: state.functionName,
        arguments: state.functionArguments,
      },
      index: state.index,
    }))
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const message: ChoiceMessage = {
    role: agg.role,
    content: agg.content || null,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
  };

  return {
    index: agg.index,
    message,
    finish_reason: agg.finishReason ?? 'stop',
  };
}

/**
 * Create an empty response for error cases
 */
function createEmptyResponse(): OpenaiChatResponse {
  return {
    id: 'empty',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'unknown',
    choices: [],
  };
}
