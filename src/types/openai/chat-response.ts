import type { ToolCall, LogProbs } from './common';


export type OpenaiChatResponse = {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  system_fingerprint?: string | null;
  choices: Choice[];
  usage?: OpenaiTokenUsage;
};


export type ChoiceMessage = {
  role: 'assistant';
  content: string | null;
  refusal?: string | null;
  tool_calls?: ToolCall[] | null;
};

export type Choice = {
  index: number;
  message: ChoiceMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | string | null;
  logprobs?: LogProbs | null;
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

export type OpenaiTokenUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;

  prompt_tokens_details?: PromptTokensDetails;
  completion_tokens_details?: CompletionTokensDetails;

  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: PromptTokensDetails | null;

  claude_cache_creation_5_m_tokens?: number;
  claude_cache_creation_1_h_tokens?: number;
};
