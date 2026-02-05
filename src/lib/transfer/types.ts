/**
 * LLM 提供商类型
 */
export type LLMProvider = 'openai' | 'claude' | 'gemini';

/**
 * 转换结果类型
 */
export interface TransferResult {
  success: boolean;
  data?: unknown;
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
  readonly provider: LLMProvider;
  canHandle(flow: Flow): boolean;
  getSSEContent(flow: Flow): Promise<string>;
  transfer(sseText: string): TransferResult;
}
