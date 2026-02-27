import type { OpenaiTokenUsage, CompletionTokensDetails } from '../openai/common';
import type {
  OpenaiResponseInputItem,
  OpenaiResponseTool,
  OpenaiResponseToolChoice,
  OpenaiResponseReasoningConfig,
  OpenaiResponseTextConfig,
} from './response-request';

// Responses API output item uses the same shape as input items.
export type OpenaiResponseOutputItem = OpenaiResponseInputItem;

// Error payload shape kept loose to avoid dropping fields.
export type OpenaiResponseError =
  | {
    type?: string;
    message?: string;
    code?: string;
    param?: string;
    [key: string]: unknown;
  }
  | null;

// Usage payload extends OpenAI common usage with Responses-specific details.
export type OpenaiResponseUsage = OpenaiTokenUsage & {
  output_tokens_details?: CompletionTokensDetails;
};

// Main Responses API response body.
export type OpenaiResponse = {
  id: string;
  object?: string;
  created_at?: number | null;
  completed_at?: number | null;
  status?: string | null;
  background?: boolean | null;
  model?: string | null;
  instructions?: string | null;
  output?: OpenaiResponseOutputItem[] | null;
  tools?: OpenaiResponseTool[] | null;
  tool_choice?: OpenaiResponseToolChoice | null;
  parallel_tool_calls?: boolean | null;
  reasoning?: OpenaiResponseReasoningConfig | null;
  text?: OpenaiResponseTextConfig | null;
  usage?: OpenaiResponseUsage | null;
  include?: string[] | null;
  store?: boolean | null;
  max_output_tokens?: number | null;
  max_tool_calls?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  frequency_penalty?: number | null;
  presence_penalty?: number | null;
  truncation?: string | null;
  prompt_cache_key?: string | null;
  prompt_cache_retention?: string | null;
  previous_response_id?: string | null;
  service_tier?: string | null;
  safety_identifier?: string | null;
  user?: string | null;
  error?: OpenaiResponseError;
  incomplete_details?: unknown;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

// SSE wrapper meta info produced by the aggregation script.
export type OpenaiResponseSSEMeta = {
  event_count?: number;
  parse_error_count?: number;
  unknown_event_types?: string[];
  [key: string]: unknown;
};

// SSE conversion wrapper: `{ response, meta }`.
export type OpenaiResponseSSEWrapper = {
  response: OpenaiResponse;
  meta?: OpenaiResponseSSEMeta;
};

// Type guard for a raw Responses API response body.
export function isOpenaiResponse(data: unknown): data is OpenaiResponse {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const body = data as Record<string, unknown>;
  const hasId = typeof body.id === 'string';
  const hasSignal = typeof body.object === 'string' || typeof body.model === 'string';
  return hasId && hasSignal;
}

// Type guard for SSE wrapper payload.
export function isOpenaiResponseSSEWrapper(data: unknown): data is OpenaiResponseSSEWrapper {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const body = data as Record<string, unknown>;
  if (!('response' in body)) return false;
  return isOpenaiResponse(body.response);
}
