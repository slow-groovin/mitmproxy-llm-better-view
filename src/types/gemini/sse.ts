import type { Candidate } from './response';
import type { UsageMetadata } from './common';

export type SSEEvent = {
  nonce?: string;
  candidates?: Candidate[];
  promptFeedback?: {
    blockReason?: string;
  };
  usageMetadata?: UsageMetadata;
  modelVersion?: string;
  responseId?: string;
};

export type ParsedSSEChunk = {
  type: 'chunk' | 'done' | 'error';
  data: SSEEvent | null;
  raw: string;
  nonce?: string;
};
