/**
 * 统一的 Transfer Service 接口
 * 用于将 LLM API 的流式响应转换为完整响应
 */

/**
 * 支持的 LLM 提供商类型
 */
export type LLMProvider = 'openai' | 'claude' | 'gemini';

/**
 * 转换结果类型
 */
export interface TransferResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rawSSE?: string;
  timestamp: number;
}

/**
 * Flow 数据类型（简化版，与 pipeline.ts 中的 Flow 类型兼容）
 */
export interface Flow {
  id: string;
  response: {
    status_code: number;
    headers: Array<[string, string]>;
    contentLength: number;
  };
}

/**
 * Transfer Service 接口
 * 所有 LLM 提供商的 transfer service 都需要实现此接口
 */
export interface ITransferService {
  /**
   * 提供商名称
   */
  readonly provider: LLMProvider;

  /**
   * 检查是否支持该 Flow
   */
  canHandle(flow: Flow): boolean;

  /**
   * 获取 Flow 的 SSE 内容
   */
  getSSEContent(flow: Flow): Promise<string>;

  /**
   * 将 SSE 转换为响应对象
   */
  transfer(sseText: string): TransferResult;
}
