import type { ToolCall, LogProbs, OpenaiTokenUsage } from './common';


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
