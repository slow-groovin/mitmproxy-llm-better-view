import type { SafetyRating, UsageMetadata } from './common';
import type { Part } from './request';

export type FinishReason =
  | 'STOP'
  | 'MAX_TOKENS'
  | 'SAFETY'
  | 'RECITATION'
  | 'OTHER'
  | 'IMAGE_SAFETY'
  | 'BLOCKLIST'
  | 'PROHIBITED_CONTENT'
  | string;

export type CitationMetadata = {
  citationSources: {
    startIndex?: number;
    endIndex?: number;
    uri?: string;
    license?: string;
  }[];
};

export type GroundingMetadata = {
  groundingChunks: {
    web?: {
      uri: string;
      title: string;
    };
    retrievedContext?: {
      title: string;
      uri: string;
    };
  }[];
  groundingSupports: {
    segment?: {
      startIndex: number;
      endIndex: number;
      text: string;
    };
    groundingChunkIndices: number[];
    confidenceScores: number[];
  }[];
  searchEntryPoint?: {
    renderedContent: string;
    sdkLink: string;
  };
};

export type Candidate = {
  content: {
    parts: Part[];
    role: 'model';
  };
  finishReason?: FinishReason;
  index: number;
  safetyRatings?: SafetyRating[];
  citationMetadata?: CitationMetadata;
  groundingMetadata?: GroundingMetadata;
  tokenCount?: number;
  avgLogprobs?: number;
  finishMessage?: string;
};

export type PromptFeedback = {
  blockReason?: string;
  safetyRatings?: SafetyRating[];
};

export type GeminiResponse = {
  candidates: Candidate[];
  promptFeedback?: PromptFeedback;
  usageMetadata?: UsageMetadata;
  modelVersion?: string;
  responseId?: string;
};
