import type { ToolCall, JSONSchema, LogitBias, Audio } from './common';

export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type TextContentItem = { type: 'text'; text: string };

export type ImageUrl = { url: string };

export type ImageContentItem = { type: 'image_url'; image_url: ImageUrl };

export type ArrayContent = (TextContentItem | ImageContentItem)[];

export type MessageContent = string | ArrayContent | null;

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

export type ResponseFormatType = 'text' | 'json_object' ;

export type JSONSchemaFormat = {
  name: string;
  strict?: boolean;
  schema: JSONSchema;
};

export type ResponseFormat = { type: ResponseFormatType } | { type: 'json_schema'; json_schema: JSONSchemaFormat };

export type OpenaiChatRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number | null;
  top_p?: number | null;
  max_tokens?: number | null;
  max_completion_tokens?: number | null;
  n?: number | null;
  stream?: boolean | null;
  frequency_penalty?: number | null;
  presence_penalty?: number | null;
  logit_bias?: LogitBias | null;
  response_format?: ResponseFormat | null;
  tools?: Tool[] | null;
  tool_choice?: ToolChoice | null;
  seed?: number | null;
  stop?: string | string[] | null;
  top_logprobs?: number | null;
  logprobs?: boolean | null;
  modalities?: string[] | null;
  audio?: Audio | null;
  stream_options?: {
    include_usage?: boolean;
  } | null;
  prompt?: string;
};
