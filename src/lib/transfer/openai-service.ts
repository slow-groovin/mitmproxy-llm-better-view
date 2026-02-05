import type { Flow, TransferResult, ITransferService, LLMProvider } from './types';
import type { OpenaiChatResponse } from '../../types/openai/chat-response';
import { aggregateSSEToResponse } from './openai-chat-transfer';

/**
 * OpenAI Chat Transfer Service
 * 处理 OpenAI 聊天 API 的 SSE 流式响应转换
 */
export class OpenaiTransferService implements ITransferService {
  readonly provider: LLMProvider = 'openai';

  /**
   * 检查是否为 OpenAI 聊天 API 的 Flow
   */
  canHandle(flow: Flow): boolean {
    // 检查是否为聊天端点
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

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch response content: ${response.statusText}`);
      }
      const sseText=(await response?.json())?.text;
  
      return sseText;
    } catch (error) {
      throw new Error(`Error fetching SSE content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 将 SSE 转换为 OpenAI 响应对象
   */
  transfer(sseText: string): TransferResult<OpenaiChatResponse> {
    try {
      if (!sseText || sseText.trim() === '') {
        return {
          success: false,
          error: 'Empty SSE content',
          rawSSE: sseText,
          timestamp: Date.now(),
        };
      }

      const response = aggregateSSEToResponse(sseText);

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
}

/**
 * 单例实例
 */
export const openaiTransferService = new OpenaiTransferService();
