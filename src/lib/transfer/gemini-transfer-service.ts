import type { Flow, TransferResult, ITransferService } from './types';
import type { GeminiResponse, Candidate } from '../../types/gemini/response';
import type { Part, TextPart } from '../../types/gemini/request';

/**
 * Internal aggregation state for a single candidate
 */
interface AggregatedCandidateState {
  index: number;
  role: 'model';
  parts: Part[];
  finishReason: string | null;
  safetyRatings?: any[];
  citationMetadata?: any;
  groundingMetadata?: any;
  tokenCount?: number;
  avgLogprobs?: number;
  finishMessage?: string;
}

/**
 * Gemini Transfer Service
 * 处理 Gemini API 的 SSE 流式响应转换
 */
export class GeminiTransferService implements ITransferService {
  readonly provider = 'gemini' as const;
  /**
   * 检查是否为 Gemini API 的 Flow
   */
  canHandle(flow: Flow): boolean {
    const path = window.location.pathname;
    return (
      flow.response.status_code === 200 &&
      flow.response.contentLength > 0 &&
      (path.includes('/v1beta/models/generateContent') ||
        path.includes('/v1/models/generateContent') ||
        path.includes('/v1beta/models/streamGenerateContent') ||
        path.includes('/v1/models/streamGenerateContent') ||
        path.includes('generativelanguage.googleapis.com'))
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
   * 将 SSE 转换为 Gemini 响应对象
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
   */
  private parseSSEEvents(sseText: string): any[] {
    const events: any[] = [];
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
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataContent = line.slice(6).trim();
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
   * Aggregate Gemini SSE chunks into a complete response
   */
  private aggregateSSEToResponse(sseText: string): GeminiResponse {
    const events = this.parseSSEEvents(sseText);
    if (!events.length) {
      return this.createEmptyResponse();
    }
    return this.processSSEEvents(events);
  }

  /**
   * Process SSE events into a response
   */
  private processSSEEvents(events: any[]): GeminiResponse {
    // Find the final event with usageMetadata
    const finalEvent = events.find(e => e.usageMetadata) || events[events.length - 1];

    // Find any event with metadata
    const metaEvent = events.find(e => e.modelVersion || e.responseId) || finalEvent;

    const aggregatedCandidates = this.aggregateCandidates(events);

    const result: GeminiResponse = {
      candidates: aggregatedCandidates,
      modelVersion: metaEvent.modelVersion,
      responseId: metaEvent.responseId,
      usageMetadata: finalEvent.usageMetadata,
    };

    // Add promptFeedback from any event that has it
    const promptFeedbackEvent = events.find(e => e.promptFeedback);
    if (promptFeedbackEvent?.promptFeedback) {
      result.promptFeedback = promptFeedbackEvent.promptFeedback;
    }

    return result;
  }

  /**
   * Aggregate candidates from SSE events
   */
  private aggregateCandidates(events: any[]): Candidate[] {
    const candidateMap = new Map<number, AggregatedCandidateState>();

    for (const event of events) {
      if (!event.candidates) continue;

      for (const candidate of event.candidates) {
        const index = candidate.index ?? 0;

        // Initialize
        if (!candidateMap.has(index)) {
          candidateMap.set(index, {
            index,
            role: 'model',
            parts: [],
            finishReason: null,
          });
        }

        const agg = candidateMap.get(index)!;

        // Aggregate content parts
        if (candidate.content?.parts) {
          this.aggregateParts(agg.parts, candidate.content.parts);
        }

        // Copy metadata from the last event
        if (candidate.finishReason) {
          agg.finishReason = candidate.finishReason;
        }
        if (candidate.safetyRatings) {
          agg.safetyRatings = candidate.safetyRatings;
        }
        if (candidate.citationMetadata) {
          agg.citationMetadata = candidate.citationMetadata;
        }
        if (candidate.groundingMetadata) {
          agg.groundingMetadata = candidate.groundingMetadata;
        }
        if (candidate.tokenCount !== undefined) {
          agg.tokenCount = candidate.tokenCount;
        }
        if (candidate.avgLogprobs !== undefined) {
          agg.avgLogprobs = candidate.avgLogprobs;
        }
        if (candidate.finishMessage) {
          agg.finishMessage = candidate.finishMessage;
        }
      }
    }

    return Array.from(candidateMap.values())
      .map(agg => this.convertToCandidate(agg))
      .sort((a, b) => a.index - b.index);
  }

  /**
   * Aggregate parts from candidate content
   */
  private aggregateParts(existingParts: Part[], newParts: Part[]): void {
    for (const part of newParts) {
      // Check if this is a text part
      if (this.isTextPart(part)) {
        // Check if the last part is also a text part and merge
        const lastPart = existingParts[existingParts.length - 1];
        if (lastPart && this.isTextPart(lastPart)) {
          (lastPart as TextPart).text += part.text;
          if (part.thought !== undefined) {
            (lastPart as TextPart).thought = part.thought;
          }
        } else {
          existingParts.push({ ...part });
        }
      } else {
        // For non-text parts, just append
        existingParts.push({ ...part });
      }
    }
  }

  /**
   * Type guard for TextPart
   */
  private isTextPart(part: Part): part is TextPart {
    return 'text' in part;
  }

  /**
   * Convert aggregated state to Candidate
   */
  private convertToCandidate(agg: AggregatedCandidateState): Candidate {
    const result: Candidate = {
      index: agg.index,
      content: {
        parts: agg.parts,
        role: agg.role,
      },
      finishReason: agg.finishReason ?? 'STOP',
    };

    if (agg.safetyRatings) {
      result.safetyRatings = agg.safetyRatings;
    }
    if (agg.citationMetadata) {
      result.citationMetadata = agg.citationMetadata;
    }
    if (agg.groundingMetadata) {
      result.groundingMetadata = agg.groundingMetadata;
    }
    if (agg.tokenCount !== undefined) {
      result.tokenCount = agg.tokenCount;
    }
    if (agg.avgLogprobs !== undefined) {
      result.avgLogprobs = agg.avgLogprobs;
    }
    if (agg.finishMessage) {
      result.finishMessage = agg.finishMessage;
    }

    return result;
  }

  /**
   * Create an empty response for error cases
   */
  private createEmptyResponse(): GeminiResponse {
    return {
      candidates: [],
    };
  }
}

/**
 * 单例实例
 */
export const geminiTransferService = new GeminiTransferService();
