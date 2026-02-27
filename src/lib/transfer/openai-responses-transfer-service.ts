import type { Flow, TransferResult, ITransferService } from './types';
import type {
  OpenaiResponse,
  OpenaiResponseOutputItem,
  OpenaiResponseSSEWrapper,
  OpenaiResponseSSEMeta,
} from '@/types/openai-response/response-response';

type MutableItem = Record<string, unknown> & {
  id?: string;
  content?: Array<Record<string, unknown> | undefined>;
  summary?: Array<Record<string, unknown> | undefined>;
  arguments?: string;
};

type AggregateState = {
  response: OpenaiResponse | null;
  outputByIndex: Map<number, MutableItem>;
  outputIndexByItemId: Map<string, number>;
  eventCount: number;
  parseErrorCount: number;
  unknownEventTypes: Set<string>;
};

/**
 * OpenAI Responses Transfer Service
 * 处理 Responses API 的 SSE 流式响应转换
 */
export class OpenaiResponsesTransferService implements ITransferService {
  readonly provider = 'openai-response' as const;

  /**
   * 检查是否为 OpenAI Responses API 的 Flow
   */
  canHandle(flow: Flow): boolean {
    return (
      flow.response.status_code === 200 &&
      flow.response.contentLength > 0 
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
   * 将 SSE 转换为 Responses API 响应对象
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
   * Parse SSE text to response + meta wrapper
   */
  private aggregateSSEToResponse(sseText: string): OpenaiResponseSSEWrapper {
    const state = this.createState();
    this.parseSSEText(sseText, state);

    const output = [...state.outputByIndex.entries()]
      .sort((a, b) => a[0] - b[0])
      .map((entry) => entry[1]) as OpenaiResponseOutputItem[];

    const response = (state.response ?? {}) as OpenaiResponse;
    if (output.length > 0) {
      response.output = output;
    } else if (!Array.isArray(response.output)) {
      response.output = [];
    }

    const meta: OpenaiResponseSSEMeta = {
      event_count: state.eventCount,
      parse_error_count: state.parseErrorCount,
      unknown_event_types: [...state.unknownEventTypes].sort(),
    };

    return { response, meta };
  }

  private createState(): AggregateState {
    return {
      response: null,
      outputByIndex: new Map(),
      outputIndexByItemId: new Map(),
      eventCount: 0,
      parseErrorCount: 0,
      unknownEventTypes: new Set(),
    };
  }

  private ensureArrayAt<T>(arr: Array<T | undefined>, index: number, factory: () => T): T {
    while (arr.length <= index) arr.push(undefined);
    if (arr[index] === undefined) arr[index] = factory();
    return arr[index] as T;
  }

  private mergeItem(target: Record<string, unknown>, source: Record<string, unknown>) {
    for (const [key, value] of Object.entries(source)) {
      if (key === 'content' && Array.isArray(value)) {
        if (!Array.isArray((target as MutableItem).content)) (target as MutableItem).content = [];
        const targetContent = (target as MutableItem).content!;
        value.forEach((item, index) => {
          if (item !== undefined) targetContent[index] = item as Record<string, unknown>;
        });
        continue;
      }
      if (key === 'summary' && Array.isArray(value)) {
        if (!Array.isArray((target as MutableItem).summary)) (target as MutableItem).summary = [];
        const targetSummary = (target as MutableItem).summary!;
        value.forEach((item, index) => {
          if (item !== undefined) targetSummary[index] = item as Record<string, unknown>;
        });
        continue;
      }
      target[key] = value;
    }
  }

  private ensureItem(state: AggregateState, outputIndex: number, itemId?: string | null) {
    let item = state.outputByIndex.get(outputIndex);
    if (!item) {
      item = { id: itemId || `item_${outputIndex}` };
      state.outputByIndex.set(outputIndex, item);
    }

    if (itemId && !item.id) item.id = itemId;
    if (item.id) state.outputIndexByItemId.set(item.id, outputIndex);

    return item;
  }

  private findOrCreateItemById(state: AggregateState, itemId: string, hintedOutputIndex?: number | null) {
    let index = hintedOutputIndex ?? state.outputIndexByItemId.get(itemId);
    if (index === undefined) index = state.outputByIndex.size;
    return this.ensureItem(state, index, itemId);
  }

  private applyEvent(state: AggregateState, eventName: string | null, payload: Record<string, unknown>) {
    const type = eventName || (payload?.type as string | undefined);
    if (!type) return;
    state.eventCount += 1;

    if (type === 'response.created' || type === 'response.in_progress' || type === 'response.completed') {
      const response = payload.response;
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        state.response = response as OpenaiResponse;
      }
      return;
    }

    if (type === 'response.output_item.added' || type === 'response.output_item.done') {
      const index = payload.output_index as number | undefined;
      const incomingItem = payload.item as Record<string, unknown> | undefined;
      if (!incomingItem || typeof incomingItem !== 'object') return;
      const item = this.ensureItem(state, index ?? state.outputByIndex.size, incomingItem.id as string | undefined);
      this.mergeItem(item, incomingItem);
      return;
    }

    if (type === 'response.content_part.added' || type === 'response.content_part.done') {
      const itemId = payload.item_id as string | undefined;
      const contentIndex = payload.content_index as number | undefined;
      if (!itemId || typeof contentIndex !== 'number') return;

      const item = this.findOrCreateItemById(state, itemId, payload.output_index as number | undefined);
      if (!Array.isArray(item.content)) item.content = [];

      if (type === 'response.content_part.done') {
        this.ensureArrayAt(item.content, contentIndex, () => ({}));
        item.content[contentIndex] = (payload.part || {}) as Record<string, unknown>;
        return;
      }

      const part = this.ensureArrayAt(item.content, contentIndex, () => ({}));
      this.mergeItem(part, (payload.part || {}) as Record<string, unknown>);
      return;
    }

    if (type === 'response.output_text.delta' || type === 'response.output_text.done') {
      const itemId = payload.item_id as string | undefined;
      const contentIndex = payload.content_index as number | undefined;
      if (!itemId || typeof contentIndex !== 'number') return;

      const item = this.findOrCreateItemById(state, itemId, payload.output_index as number | undefined);
      if (!Array.isArray(item.content)) item.content = [];
      const part = this.ensureArrayAt(item.content, contentIndex, () => ({
        type: 'output_text',
        text: '',
        annotations: [],
        logprobs: [],
      }));

      if (type === 'response.output_text.delta') {
        part.text = `${part.text || ''}${(payload.delta as string | undefined) || ''}`;
        return;
      }

      part.text = (payload.text as string | undefined) || '';
      if (Array.isArray(payload.logprobs)) part.logprobs = payload.logprobs as unknown[];
      return;
    }

    if (type === 'response.function_call_arguments.delta' || type === 'response.function_call_arguments.done') {
      const itemId = payload.item_id as string | undefined;
      if (!itemId) return;
      const item = this.findOrCreateItemById(state, itemId, payload.output_index as number | undefined);

      if (type === 'response.function_call_arguments.delta') {
        item.arguments = `${item.arguments || ''}${(payload.delta as string | undefined) || ''}`;
        return;
      }

      item.arguments = (payload.arguments as string | undefined) || '';
      return;
    }

    if (
      type === 'response.reasoning_summary_part.added' ||
      type === 'response.reasoning_summary_part.done' ||
      type === 'response.reasoning_summary_text.delta' ||
      type === 'response.reasoning_summary_text.done'
    ) {
      const itemId = payload.item_id as string | undefined;
      const summaryIndex = payload.summary_index as number | undefined;
      if (!itemId || typeof summaryIndex !== 'number') return;

      const item = this.findOrCreateItemById(state, itemId, payload.output_index as number | undefined);
      if (!Array.isArray(item.summary)) item.summary = [];
      const summaryPart = this.ensureArrayAt(item.summary, summaryIndex, () => ({
        type: 'summary_text',
        text: '',
      }));

      if (type === 'response.reasoning_summary_part.done') {
        item.summary[summaryIndex] = (payload.part || summaryPart) as Record<string, unknown>;
        return;
      }
      if (type === 'response.reasoning_summary_part.added') {
        this.mergeItem(summaryPart, (payload.part || {}) as Record<string, unknown>);
        return;
      }
      if (type === 'response.reasoning_summary_text.delta') {
        summaryPart.text = `${summaryPart.text || ''}${(payload.delta as string | undefined) || ''}`;
        return;
      }

      summaryPart.text = (payload.text as string | undefined) || '';
      return;
    }

    state.unknownEventTypes.add(type);
  }

  private parseSSEText(sseText: string, state: AggregateState) {
    const lines = sseText.replace(/\r\n/g, '\n').split('\n');
    let currentEvent: string | null = null;
    let currentDataLines: string[] = [];

    const flush = () => {
      if (!currentEvent && currentDataLines.length === 0) return;
      const dataText = currentDataLines.join('\n').trim();
      currentDataLines = [];

      if (!dataText || dataText === '[DONE]') {
        currentEvent = null;
        return;
      }

      try {
        const payload = JSON.parse(dataText) as Record<string, unknown>;
        this.applyEvent(state, currentEvent, payload);
      } catch {
        state.parseErrorCount += 1;
      }

      currentEvent = null;
    };

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');
      if (line.trim() === '') {
        flush();
        continue;
      }

      if (line.startsWith('event:')) {
        if (currentEvent || currentDataLines.length > 0) flush();
        currentEvent = line.slice('event:'.length).trim();
        continue;
      }

      if (line.startsWith('data:')) {
        currentDataLines.push(line.slice('data:'.length).trimStart());
        continue;
      }
    }

    flush();
  }
}

/**
 * 单例实例
 */
export const openaiResponsesTransferService = new OpenaiResponsesTransferService();
