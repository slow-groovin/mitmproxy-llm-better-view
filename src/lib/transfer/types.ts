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
