/**
 * Claude API Request Types
 */

/**
 * Cache control configuration
 */
export interface CacheControl {
  type: 'ephemeral';
}

/**
 * Text content block
 */
export interface TextBlock {
  type: 'text';
  text: string;
  cache_control?: CacheControl;
}

/**
 * Thinking content block
 */
export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
  signature?: string;
}

/**
 * Tool use content block
 */
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result content block
 */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | {type: 'text', text:string}[];
  is_error?: boolean;
}

/**
 * Image content block
 */
export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

/**
 * Content block union type
 */
export type ContentBlock =
  | string
  | TextBlock
  | ThinkingBlock
  | ToolUseBlock
  | ToolResultBlock
  | ImageBlock;

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Message in conversation
 */
export interface ClaudeMessage {
  role: MessageRole;
  content: string | ContentBlock[];
}

/**
 * System message
 */
export interface SystemMessage {
  type: 'text';
  text: string;
  cache_control?: CacheControl;
}

/**
 * JSON Schema definition
 */
export interface JSONSchema {
  $schema?: string;
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
  enum?: unknown[];
  items?: JSONSchema;
  exclusiveMinimum?: number;
  maximum?: number;
}

export interface JSONSchemaProperty {
  type: string;
  description?: string;
  default?:unknown;
  enum?: unknown[];
  items?: JSONSchema;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  exclusiveMinimum?:number;
  maximum?:number;
  "additionalProperties"?: false;

}

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  input_schema: JSONSchema;
}

/**
 * Thinking configuration
 */
export interface ThinkingConfig {
  type: 'enabled' | 'disabled';
  budget_tokens?: number;
}

/**
 * Request metadata
 */
export interface Metadata {
  user_id?: string;
}

/**
 * Main Claude API request
 */
export interface ClaudeRequest {
  model: string;
  messages: ClaudeMessage[];
  system?: string | SystemMessage[];
  tools?: Tool[];
  tool_choice?: {
    type: 'auto' | 'any' | 'tool';
    name?: string;
    disable_parallel_tool_use?: boolean;
  };
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  thinking?: ThinkingConfig;
  metadata?: Metadata;
}
