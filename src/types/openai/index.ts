// ============================================================================
// OpenAI Chat Completions API Types
// ============================================================================

// Message role types
export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'tool';

// Multimodal content types
export type TextContentItem = { type: 'text'; text: string };
export type ImageUrl = { url: string };
export type ImageContentItem = { type: 'image_url'; image_url: ImageUrl };
export type ArrayContent = (TextContentItem | ImageContentItem)[];
export type MessageContent = string | ArrayContent | null;

// Tool call types
export type ToolCallFunction = {
  name: string;
  arguments: string; // JSON string
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: ToolCallFunction;
  index?: number; // Used in streaming
};

// Message types
export type BaseMessage = {
  role: ChatMessageRole;
  content: MessageContent;
};

export type AssistantMessage = BaseMessage & {
  role: 'assistant';
  content: string | null;
  tool_calls?: ToolCall[];
  refusal?: string | null;
};

export type ToolMessage = BaseMessage & {
  role: 'tool';
  tool_call_id: string;
  name?: string;
};

export type ChatMessage = BaseMessage | AssistantMessage | ToolMessage;

// Tool definition types
export type JSONSchema = Record<string, unknown>;

export type ToolFunctionDefinition = {
  name: string;
  description?: string;
  parameters?: JSONSchema;
};

export type Tool = {
  type: 'function';
  function: ToolFunctionDefinition;
};

export type ToolChoice = 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };

// Response format types
export type ResponseFormatType = 'text' | 'json_object' | 'json_schema';

export type JSONSchemaFormat = {
  name: string;
  strict?: boolean;
  schema: JSONSchema;
};

export type ResponseFormat = { type: ResponseFormatType } | { type: 'json_schema'; json_schema: JSONSchemaFormat };

// Token usage details types
export type PromptTokensDetails = {
  cached_tokens?: number;
  text_tokens?: number;
  audio_tokens?: number;
  image_tokens?: number;
};

export type CompletionTokensDetails = {
  text_tokens?: number;
  audio_tokens?: number;
  reasoning_tokens?: number;
};

export type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: PromptTokensDetails;
  completion_tokens_details?: CompletionTokensDetails;
  // Additional fields (e.g., from other providers)
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: PromptTokensDetails;
  claude_cache_creation_5_m_tokens?: number;
  claude_cache_creation_1_h_tokens?: number;
};

// Logit bias
export type LogitBias = Record<number, number>;

// Audio parameters
export type Audio = {
  voice?: string;
  format?: string;
};

// ============================================================================
// OpenAI Chat Completion Request Types
// ============================================================================

export type ChatCompletionRequest = {
  // Required fields
  model: string;
  messages: ChatMessage[];

  // Core sampling parameters
  temperature?: number | null;
  top_p?: number | null;
  max_tokens?: number | null; // Legacy field
  max_completion_tokens?: number | null; // Preferred field
  n?: number | null;
  stream?: boolean | null;

  // Penalty and bias
  frequency_penalty?: number | null;
  presence_penalty?: number | null;
  logit_bias?: LogitBias | null;

  // Output format control
  response_format?: ResponseFormat | null;

  // Tool/function calling
  tools?: Tool[] | null;
  tool_choice?: ToolChoice | null;

  // Other control parameters
  seed?: number | null;
  stop?: string | string[] | null;
  top_logprobs?: number | null;
  logprobs?: boolean | null;
  modalities?: string[] | null;
  audio?: Audio | null;

  // Streaming options
  stream_options?: {
    include_usage?: boolean;
  } | null;

  // Additional fields for compatibility
  prompt?: string; // Some providers use this instead of messages
};

// ============================================================================
// OpenAI Chat Completion Response Types (Non-streaming)
// ============================================================================

export type ChoiceMessage = {
  role: 'assistant';
  content: string | null;
  refusal?: string | null;
  tool_calls?: ToolCall[] | null;
};

export type LogProbs = {
  tokens: string[];
  token_logprobs: (number | null)[];
  top_logprobs: (Record<string, number> | null)[];
  text_offset: number[];
};

export type Choice = {
  index: number;
  message: ChoiceMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | string | null;
  logprobs?: LogProbs | null;
};

export type ChatCompletionResponse = {
  id: string;
  object: 'chat.completion';
  created: number; // Unix timestamp
  model: string;
  system_fingerprint?: string | null;
  choices: Choice[];
  usage?: Usage;
};

// ============================================================================
// OpenAI Chat Completion SSE (Streaming) Types
// ============================================================================

export type Delta = {
  role?: 'assistant';
  content?: string;
  reasoning_content?: string; // GLM extension
  tool_calls?: ToolCall[];
  function_call?: { name?: string; arguments?: string }; // Deprecated
};

export type StreamChoice = {
  index: number;
  delta: Delta;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | string | null;
  logprobs?: LogProbs | null;
};

export type ChatCompletionChunk = {
  id: string;
  object: 'chat.completion.chunk';
  created: number; // Unix timestamp
  model: string;
  service_tier?: string;
  system_fingerprint?: string;
  choices: StreamChoice[];
  usage?: Usage;
};

// SSE event types
export type SSEEvent = {
  event?: string;
  data: string | null; // JSON string or "[DONE]"
  timestamp?: number;
};

export type ParsedSSEChunk = {
  type: 'chunk' | 'done' | 'error';
  data: ChatCompletionChunk | null;
  raw: string;
  timestamp?: number;
};
