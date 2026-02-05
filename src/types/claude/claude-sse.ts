/**
 * Claude API SSE (Server-Sent Events) Stream Types
 */

/**
 * Message start event data
 */
export interface MessageStartData {
  type: 'message_start';
  message: {
    type: 'message';
    id: string;
    role: 'assistant';
    content: unknown[];
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
    };
  };
}

/**
 * Content block start event data
 */
export interface ContentBlockStartData {
  type: 'content_block_start';
  index: number;
  content_block: {
    type: string;
    [key: string]: unknown;
  };
}

/**
 * Content block delta - text delta
 */
export interface TextDelta {
  type: 'text_delta';
  text: string;
}

/**
 * Content block delta - thinking delta
 */
export interface ThinkingDelta {
  type: 'thinking_delta';
  thinking: string;
}

/**
 * Content block delta union
 */
export type ContentBlockDelta = TextDelta | ThinkingDelta;

/**
 * Content block delta event data
 */
export interface ContentBlockDeltaData {
  type: 'content_block_delta';
  index: number;
  delta: ContentBlockDelta;
}

/**
 * Content block stop event data
 */
export interface ContentBlockStopData {
  type: 'content_block_stop';
  index: number;
}

/**
 * Message delta event data
 */
export interface MessageDeltaData {
  type: 'message_delta';
  delta: {
    stop_reason: string | null;
    stop_sequence: string | null;
  };
  usage: {
    output_tokens: number;
  };
}

/**
 * Message stop event data
 */
export interface MessageStopData {
  type: 'message_stop';
}

/**
 * Error event data
 */
export interface ErrorData {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Ping event data
 */
export interface PingData {
  type: 'ping';
}

/**
 * SSE event types
 */
export type SSEEventType =
  | 'message_start'
  | 'content_block_start'
  | 'content_block_delta'
  | 'content_block_stop'
  | 'message_delta'
  | 'message_stop'
  | 'error'
  | 'ping';

/**
 * SSE event data union
 */
export type SSEEventData =
  | MessageStartData
  | ContentBlockStartData
  | ContentBlockDeltaData
  | ContentBlockStopData
  | MessageDeltaData
  | MessageStopData
  | ErrorData
  | PingData;

/**
 * SSE event
 */
export interface SSEEvent {
  event: SSEEventType;
  data: SSEEventData;
}

/**
 * Parsed SSE line (as returned by ndjson format)
 */
export interface SSELine {
  event: string;
  data: string;
}

/**
 * Helper function to parse SSE data
 */
export function parseSSEData(data: string): SSEEventData {
  return JSON.parse(data) as SSEEventData;
}

/**
 * Helper function to parse an SSE line
 */
export function parseSSELine(line: string): SSEEvent | null {
  const match = line.match(/^event:\s*(.+)$/m);
  const dataMatch = line.match(/^data:\s*(.+)$/m);

  if (!match || !dataMatch) {
    return null;
  }

  return {
    event: match[1].trim() as SSEEventType,
    data: parseSSEData(dataMatch[1].trim()),
  };
}
