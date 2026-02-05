export type SafetyCategory =
  | 'HARM_CATEGORY_HATE_SPEECH'
  | 'HARM_CATEGORY_SEXUALLY_EXPLICIT'
  | 'HARM_CATEGORY_HARASSMENT'
  | 'HARM_CATEGORY_DANGEROUS_CONTENT'
  | string;

export type SafetyThreshold =
  | 'BLOCK_LOW_AND_ABOVE'
  | 'BLOCK_MEDIUM_AND_ABOVE'
  | 'BLOCK_ONLY_HIGH'
  | 'BLOCK_NONE'
  | string;

export type SafetyProbability =
  | 'NEGLIGIBLE'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | string;

export type SafetyRating = {
  category: SafetyCategory;
  probability: SafetyProbability;
  blocked?: boolean;
};

export type Modality = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | string;

export type TokenDetails = {
  modality: Modality;
  tokenCount: number;
};

export type CacheTokenDetails = {
  modality: Modality;
  tokenCount: number;
};

export type UsageMetadata = {
  promptTokenCount: number;
  candidatesTokenCount?: number;
  totalTokenCount: number;
  promptTokensDetails?: TokenDetails[];
  candidatesTokensDetails?: TokenDetails[];
  cachedContentTokenCount?: number;
  cacheTokensDetails?: CacheTokenDetails[];
  thoughtsTokenCount?: number;
};

export type JSONSchema = Record<string, unknown>;
