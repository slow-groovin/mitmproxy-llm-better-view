import type { Flow, TransferResult } from './types';
import type { OpenaiChatResponse, Choice, ChoiceMessage } from '../../types/openai/chat-response';
import type {
  OpenaiChatCompletionChunk,
} from '../../types/openai/chat-sse';
import type { ToolCall } from '../../types/openai/common';

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
 * OpenAI Chat Transfer Service
 * 处理 OpenAI 聊天 API 的 SSE 流式响应转换
 */
export class OpenaiTransferService {
  /**
   * 检查是否为 OpenAI 聊天 API 的 Flow
   */
  canHandle(flow: Flow): boolean {
    const path = window.location.pathname;
    return (
      flow.response.status_code === 200 &&
      flow.response.contentLength > 0 &&
      (path.includes('/chat/completions') ||
        path.includes('/v1/chat/completions') ||
        path.includes('/v1/completions'))
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
   * 将 SSE 转换为 OpenAI 响应对象
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
   * Parse SSE text string into OpenaiChatCompletionChunk array
   */
  private parseSSEEvents(sseText: string): OpenaiChatCompletionChunk[] {
    const events: OpenaiChatCompletionChunk[] = [];
    let blocks = sseText.replace(/\r\n/g, '\n').split('\n\n');

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
            // Ignore parse errors
          }
        }
      }
    }
    return events;
  }

  /**
   * Aggregate OpenAI Chat SSE chunks into a complete response
   */
  private aggregateSSEToResponse(sseText: string): OpenaiChatResponse {
    const events = this.parseSSEEvents(sseText);
    if (!events.length) {
      return this.createEmptyResponse();
    }
    return this.processSSEEvents(events);
  }

  /**
   * Process SSE events into a response
   */
  private processSSEEvents(events: OpenaiChatCompletionChunk[]): OpenaiChatResponse {
    const finalEvent = events.find(e => e.usage) || events[events.length - 1];
    const metaEvent = events.find(e => e.id && e.model) || finalEvent;

    return {
      id: metaEvent.id || 'unknown',
      object: 'chat.completion',
      created: metaEvent.created || Math.floor(Date.now() / 1000),
      model: metaEvent.model || 'unknown',
      system_fingerprint: metaEvent.system_fingerprint ?? null,
      choices: this.aggregateChoices(events),
      usage: finalEvent.usage ?? undefined,
    };
  }

  /**
   * Aggregate choices from SSE events
   */
  private aggregateChoices(events: OpenaiChatCompletionChunk[]): Choice[] {
    const choiceMap = new Map<number, AggregatedChoiceState>();

    for (const event of events) {
      if (!event.choices) continue;

      for (const choice of event.choices) {
        const index = choice.index;

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
            this.aggregateToolCalls(agg.toolCalls, delta.tool_calls);
          }
        }

        if (choice.finish_reason) {
          agg.finishReason = choice.finish_reason;
        }
      }
    }

    return Array.from(choiceMap.values())
      .map(agg => this.convertToChoice(agg))
      .sort((a, b) => a.index - b.index);
  }

  /**
   * Aggregate tool calls from delta
   */
  private aggregateToolCalls(
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
  private convertToChoice(agg: AggregatedChoiceState): Choice {
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
  private createEmptyResponse(): OpenaiChatResponse {
    return {
      id: 'empty',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'unknown',
      choices: [],
    };
  }
}

/**
 * 单例实例
 */
export const openaiTransferService = new OpenaiTransferService();
