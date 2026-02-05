import type { ToolCall, Usage, LogProbs } from './common';

export type OpenaiChatCompletionChunk = {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  service_tier?: string;
  system_fingerprint?: string;
  choices: StreamChoice[];
  usage?: Usage|null;
};

export type Delta = {
  role?: 'assistant';
  content?: string;
  reasoning_content?: string;
  tool_calls?: ToolCall[];
  function_call?: { name?: string; arguments?: string };
};

export type StreamChoice = {
  index: number;
  delta: Delta;
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | string | null;
  logprobs?: LogProbs | null;
};



export type OpenaiSSEEvent = {
  event?: string;
  data: string | null;
  timestamp?: number;
};

export type OpenaiParsedSSEChunk = {
  type: 'chunk' | 'done' | 'error';
  data: OpenaiChatCompletionChunk | null;
  raw: string;
  timestamp?: number;
};
