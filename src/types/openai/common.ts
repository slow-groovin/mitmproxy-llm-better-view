export type ToolCallFunction = {
  name: string;
  arguments: string;
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: ToolCallFunction;
  index?: number;
};

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
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: PromptTokensDetails;
  claude_cache_creation_5_m_tokens?: number;
  claude_cache_creation_1_h_tokens?: number;
};

export type LogProbs = {
  tokens: string[];
  token_logprobs: (number | null)[];
  top_logprobs: (Record<string, number> | null)[];
  text_offset: number[];
};

export type LogitBias = Record<number, number>;

export type Audio = {
  voice?: string;
  format?: string;
};

export type JSONSchema = Record<string, unknown>;
