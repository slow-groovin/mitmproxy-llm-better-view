// 复用 chat-completions 里已有的 JSONSchema 定义，避免重复维护。
import type { JSONSchema } from '../openai/common';

export type OpenaiResponseMessageRole = 'system' | 'developer' | 'user' | 'assistant' | 'tool';

export type OpenaiResponseMessageContentItem =
  | {
    type: 'input_text' | 'output_text' | 'summary_text';
    text: string;
  }
  | {
    type: 'input_image';
    image_url?: string;
    file_id?: string;
    detail?: 'low' | 'high' | 'auto' | string;
  }
  | {
    type: 'input_file';
    file_id?: string;
    filename?: string;
    file_data?: string;
  }
  | {
    type: string;
    [key: string]: unknown;
  };

export type OpenaiResponseMessageContent = string | OpenaiResponseMessageContentItem[] | null;

export type OpenaiResponseMessageItem = {
  type: 'message';
  id?: string;
  role: OpenaiResponseMessageRole;
  content: OpenaiResponseMessageContent;
  phase?: string;
  [key: string]: unknown;
};

export type OpenaiResponseReasoningSummaryItem = {
  type: 'summary_text';
  text: string;
};

export type OpenaiResponseReasoningItem = {
  type: 'reasoning';
  id?: string;
  summary?: OpenaiResponseReasoningSummaryItem[] | null;
  content?: unknown;
  encrypted_content?: string | null;
  [key: string]: unknown;
};

export type OpenaiResponseFunctionCallItem = {
  type: 'function_call';
  id?: string;
  name: string;
  arguments: string;
  call_id: string;
  [key: string]: unknown;
};

export type OpenaiResponseFunctionCallOutputItem = {
  type: 'function_call_output';
  id?: string;
  call_id: string;
  output: unknown;
  [key: string]: unknown;
};

export type OpenaiResponseCustomToolCallItem = {
  type: 'custom_tool_call';
  id?: string;
  call_id: string;
  name: string;
  input: unknown;
  status?: string;
  [key: string]: unknown;
};

export type OpenaiResponseCustomToolCallOutputItem = {
  type: 'custom_tool_call_output';
  id?: string;
  call_id: string;
  output: unknown;
  [key: string]: unknown;
};

export type OpenaiResponseGenericInputItem = {
  type: string;
  id?: string;
  [key: string]: unknown;
};

export type OpenaiResponseInputItem =
  | OpenaiResponseMessageItem
  | OpenaiResponseReasoningItem
  | OpenaiResponseFunctionCallItem
  | OpenaiResponseFunctionCallOutputItem
  | OpenaiResponseCustomToolCallItem
  | OpenaiResponseCustomToolCallOutputItem
  | OpenaiResponseGenericInputItem;

export type OpenaiResponseFunctionTool = {
  type: 'function';
  name: string;
  description?: string;
  strict?: boolean;
  parameters?: JSONSchema;
  [key: string]: unknown;
};

export type OpenaiResponseGenericTool = {
  type: string;
  [key: string]: unknown;
};

export type OpenaiResponseTool = OpenaiResponseFunctionTool | OpenaiResponseGenericTool;

export type OpenaiResponseToolChoice =
  | 'none'
  | 'auto'
  | 'required'
  | { type: string; name?: string; [key: string]: unknown };

export type OpenaiResponseReasoningConfig = {
  effort?: 'low' | 'medium' | 'high' | string;
  summary?: 'auto' | 'concise' | 'detailed' | string;
  [key: string]: unknown;
};

export type OpenaiResponseTextConfig = {
  verbosity?: 'low' | 'medium' | 'high' | string;
  format?: unknown;
  [key: string]: unknown;
};

export type OpenaiResponseRequest = {
  model: string;
  input?: string | OpenaiResponseInputItem | OpenaiResponseInputItem[] | null;
  instructions?: string | null;
  tools?: OpenaiResponseTool[] | null;
  tool_choice?: OpenaiResponseToolChoice | null;
  parallel_tool_calls?: boolean | null;
  reasoning?: OpenaiResponseReasoningConfig | null;
  text?: OpenaiResponseTextConfig | null;
  include?: string[] | null;
  store?: boolean | null;
  stream?: boolean | null;
  max_output_tokens?: number | null;
  max_tool_calls?: number | null;
  prompt_cache_key?: string | null;
  previous_response_id?: string | null;
  service_tier?: string | null;
  metadata?: Record<string, string> | null;
  user?: string | null;
  temperature?: number | null;
  top_p?: number | null;
  truncation?: 'auto' | 'disabled' | string | null;
  [key: string]: unknown;
};

/**
 * 用请求体结构判断是否为 OpenAI Responses API 的 request。
 */
export function isOpenaiResponseRequest(data: unknown): data is OpenaiResponseRequest {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  const body = data as Record<string, unknown>;
  const hasModel = typeof body.model === 'string';
  const hasResponseSignal = 'input' in body || 'instructions' in body || 'reasoning' in body || 'text' in body;
  const hasChatMessages = Array.isArray(body.messages);

  return hasModel && hasResponseSignal && !hasChatMessages;
}

/**
 * 路径判断兼容 `/v1/response` 和 `/v1/responses`。
 */
export function isOpenaiResponsesPath(path?: string): boolean {
  if (!path) {
    return false;
  }
  const normalizedPath = path.toLowerCase();
  return normalizedPath.includes('/v1/response');
}
