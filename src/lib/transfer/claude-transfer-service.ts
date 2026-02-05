import type { Flow, TransferResult, ITransferService } from './types';
import type { ClaudeResponse, ResponseContentBlock } from '../../types/claude/claude-response';
import type {
  SSEEvent,
  SSEEventData,
  MessageStartData,
  ContentBlockStartData,
  ContentBlockDeltaData,
  MessageDeltaData,
  TextDelta,
  ThinkingDelta,
} from '../../types/claude/claude-sse';

/**
 * Internal aggregation state for a content block
 */
interface AggregatedContentBlockState {
  index: number;
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/**
 * Internal aggregation state for the message
 */
interface AggregatedMessageState {
  id: string;
  role: 'assistant';
  model: string;
  stopReason: string | null;
  stopSequence: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  contentBlocks: Map<number, AggregatedContentBlockState>;
}

/**
 * Claude Transfer Service
 * 处理 Claude API 的 SSE 流式响应转换
 */
export class ClaudeTransferService implements ITransferService {
  readonly provider = 'claude' as const;
  /**
   * 检查是否为 Claude API 的 Flow
   */
  canHandle(flow: Flow): boolean {
    const path = window.location.pathname;
    return (
      flow.response.status_code === 200 &&
      flow.response.contentLength > 0 &&
      (path.includes('/v1/messages') ||
        path.includes('/v1beta/messages') ||
        path.includes('api.anthropic.com'))
    );
  }

  /**
   * 获取 Flow 的 SSE 内容
   */
  async getSSEContent(flow: Flow): Promise<string> {
    const { id } = flow;
    const dataUrl = `http://${window.location.host}/flows/${id}/response/content/raw.json`;

    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch response content: ${response.statusText}`);
    }
    const sseText = (await response.json())?.text;
    return sseText;
  }

  /**
   * 将 SSE 转换为 Claude 响应对象
   */
  transfer(sseText: string): TransferResult {
    try {
      if (!sseText || sseText.trim() === '') {
        return {
          success: false,
          error: 'Empty SSE content',
          rawSSE: sseText,
          timestamp: Date.now(),
        };
      }

      const response = this.aggregateSSEToResponse(sseText);

      return {
        success: true,
        data: response,
        rawSSE: sseText,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        rawSSE: sseText,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Parse SSE text string into SSEEvent array
   * Claude uses event: and data: lines
   */
  private parseSSEEvents(sseText: string): SSEEvent[] {
    const events: SSEEvent[] = [];
    const lines = sseText.replace(/\r\n/g, '\n').split('\n');

    let currentEvent = '';
    let eventLine: string | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('event:')) {
        eventLine = trimmedLine.slice(6).trim();
        currentEvent = '';
      } else if (trimmedLine.startsWith('data:')) {
        const dataLine = trimmedLine.slice(5).trim();
        currentEvent = dataLine;

        if (eventLine && currentEvent) {
          try {
            const data = JSON.parse(currentEvent) as SSEEventData;
            events.push({
              event: eventLine as any,
              data,
            });
          } catch (e) {
            // Ignore parse errors
          }
          eventLine = null;
          currentEvent = '';
        }
      }
    }

    return events;
  }

  /**
   * Aggregate Claude SSE chunks into a complete response
   */
  private aggregateSSEToResponse(sseText: string): ClaudeResponse {
    const events = this.parseSSEEvents(sseText);
    if (!events.length) {
      return this.createEmptyResponse();
    }
    return this.processSSEEvents(events);
  }

  /**
   * Process SSE events into a response
   */
  private processSSEEvents(events: SSEEvent[]): ClaudeResponse {
    const state: AggregatedMessageState = {
      id: '',
      role: 'assistant',
      model: '',
      stopReason: null,
      stopSequence: null,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadInputTokens: 0,
      contentBlocks: new Map(),
    };

    for (const event of events) {
      this.processEvent(state, event);
    }

    const content: ResponseContentBlock[] = Array.from(state.contentBlocks.values())
      .sort((a, b) => a.index - b.index)
      .map(block => this.convertToContentBlock(block));

    const result: ClaudeResponse = {
      id: state.id || 'unknown',
      type: 'message',
      role: 'assistant',
      content,
      model: state.model || 'unknown',
      stop_reason: (state.stopReason ?? 'end_turn') as any,
      stop_sequence: state.stopSequence,
      usage: {
        input_tokens: state.inputTokens,
        output_tokens: state.outputTokens,
        cache_read_input_tokens: state.cacheReadInputTokens,
      },
    };

    return result;
  }

  /**
   * Process a single SSE event
   */
  private processEvent(state: AggregatedMessageState, event: SSEEvent): void {
    const data = event.data;

    switch (data.type) {
      case 'message_start': {
        const messageStart = data as MessageStartData;
        state.id = messageStart.message.id;
        state.model = messageStart.message.model;
        state.role = messageStart.message.role;
        state.stopReason = messageStart.message.stop_reason;
        state.stopSequence = messageStart.message.stop_sequence;
        state.inputTokens = messageStart.message.usage.input_tokens;
        state.outputTokens = messageStart.message.usage.output_tokens;
        state.cacheReadInputTokens = messageStart.message.usage.cache_read_input_tokens;
        break;
      }

      case 'content_block_start': {
        const blockStart = data as ContentBlockStartData;
        const index = blockStart.index;

        if (!state.contentBlocks.has(index)) {
          state.contentBlocks.set(index, {
            index,
            type: blockStart.content_block.type,
          });

          // Initialize type-specific fields
          const block = state.contentBlocks.get(index)!;
          switch (blockStart.content_block.type) {
            case 'tool_use': {
              const toolUse = blockStart.content_block as any;
              block.id = toolUse.id;
              block.name = toolUse.name;
              block.input = toolUse.input || {};
              break;
            }
          }
        }
        break;
      }

      case 'content_block_delta': {
        const deltaData = data as ContentBlockDeltaData;
        const index = deltaData.index;

        if (!state.contentBlocks.has(index)) {
          state.contentBlocks.set(index, {
            index,
            type: 'text', // Default to text if block_start was missed
          });
        }

        const block = state.contentBlocks.get(index)!;
        const delta = deltaData.delta;

        if (delta.type === 'text_delta') {
          const textDelta = delta as TextDelta;
          block.text = (block.text || '') + textDelta.text;
          block.type = 'text';
        } else if (delta.type === 'thinking_delta') {
          const thinkingDelta = delta as ThinkingDelta;
          block.thinking = (block.thinking || '') + thinkingDelta.thinking;
          block.type = 'thinking';
        }
        break;
      }

      case 'message_delta': {
        const messageDelta = data as MessageDeltaData;
        if (messageDelta.delta.stop_reason !== undefined) {
          state.stopReason = messageDelta.delta.stop_reason;
        }
        if (messageDelta.delta.stop_sequence !== undefined) {
          state.stopSequence = messageDelta.delta.stop_sequence;
        }
        state.outputTokens = messageDelta.usage.output_tokens;
        break;
      }
    }
  }

  /**
   * Convert aggregated state to ResponseContentBlock
   */
  private convertToContentBlock(state: AggregatedContentBlockState): ResponseContentBlock {
    switch (state.type) {
      case 'text': {
        return {
          type: 'text',
          text: state.text || '',
        };
      }

      case 'thinking': {
        return {
          type: 'thinking',
          thinking: state.thinking || '',
        };
      }

      case 'tool_use': {
        return {
          type: 'tool_use',
          id: state.id || '',
          name: state.name || '',
          input: state.input || {},
        };
      }

      default: {
        // Unknown block type, return as text with what we have
        return {
          type: 'text',
          text: state.text || '',
        };
      }
    }
  }

  /**
   * Create an empty response for error cases
   */
  private createEmptyResponse(): ClaudeResponse {
    return {
      id: 'empty',
      type: 'message',
      role: 'assistant',
      content: [],
      model: 'unknown',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    };
  }
}

/**
 * 单例实例
 */
export const claudeTransferService = new ClaudeTransferService();
