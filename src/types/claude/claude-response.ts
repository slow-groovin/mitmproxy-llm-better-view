/**
 * Claude API Response Types
 */

/**
 * Citation document source
 */
export interface CitationSource {
  type: string;
  [key: string]: unknown;
}

/**
 * Citation document
 */
export interface CitationDocument {
  type: 'text';
  text: string;
  source: CitationSource;
}

/**
 * Citation block
 */
export interface Citation {
  type: 'document';
  document: CitationDocument;
  start: number;
  end: number;
}

/**
 * Response text block
 */
export interface ResponseTextBlock {
  type: 'text';
  text: string;
  citations?: Citation[];
}

/**
 * Response tool use block
 */
export interface ResponseToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Response thinking block
 */
export interface ResponseThinkingBlock {
  type: 'thinking';
  thinking: string;
}

/**
 * Response content block union
 */
export type ResponseContentBlock =
  | ResponseTextBlock
  | ResponseToolUseBlock
  | ResponseThinkingBlock;

/**
 * Stop reason
 */
export type StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';

/**
 * Usage statistics
 */
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

/**
 * Claude API response
 */
export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ResponseContentBlock[];
  model: string;
  stop_reason: StopReason;
  stop_sequence: string | null;
  usage: Usage;
  error?: null | { type: string; message: string };
  timestamp?: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}
