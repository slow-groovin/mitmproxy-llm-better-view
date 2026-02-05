import type { JSONSchema } from './common';

export type MessageRole = 'user' | 'model' | 'function' | 'system';

// Parts types - mutually exclusive
export type TextPart = {
  text: string;
  thought?: boolean;
};

export type InlineData = {
  mimeType: string;
  data: string; // base64 encoded
};

export type InlineDataPart = {
  inlineData: InlineData;
};

export type FileData = {
  mimeType: string;
  fileUri: string;
};

export type FileDataPart = {
  fileData: FileData;
};

export type FunctionCall = {
  name: string;
  args: Record<string, unknown>;
};

export type FunctionCallPart = {
  functionCall: FunctionCall;
  thoughtSignature?: string;
};

export type FunctionResponse = {
  name: string;
  response: Record<string, unknown>;
};

export type FunctionResponsePart = {
  functionResponse: FunctionResponse;
};

export type ExecutableCode = {
  language: string;
  code: string;
};

export type ExecutableCodePart = {
  executableCode: ExecutableCode;
};

export type CodeExecutionResult = {
  outcome: string;
  output: string;
};

export type CodeExecutionResultPart = {
  codeExecutionResult: CodeExecutionResult;
};

export type Part =
  | TextPart
  | InlineDataPart
  | FileDataPart
  | FunctionCallPart
  | FunctionResponsePart
  | ExecutableCodePart
  | CodeExecutionResultPart;

export type Content = {
  role: MessageRole;
  parts: Part[];
};

export type SystemInstruction = {
  parts: Part[];
  role?: 'system';
};

export type FunctionDeclaration = {
  name: string;
  description?: string;
  parameters?: {
    type: 'object';
    properties?: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      [key: string]: unknown;
    }>;
    required?: string[];
    [key: string]: unknown;
  };
};

export type FunctionDeclarations = {
  functionDeclarations: FunctionDeclaration[];
};

export type FunctionCallingConfigMode = 'AUTO' | 'ANY' | 'NONE';

export type FunctionCallingConfig = {
  mode: FunctionCallingConfigMode;
  allowedFunctionNames?: string[];
};

export type ToolConfig = {
  functionCallingConfig: FunctionCallingConfig;
};

export type Tool = FunctionDeclarations;

export type GenerationConfig = {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  candidateCount?: number;
  stopSequences?: string[];
  responseMimeType?: string;
  responseSchema?: JSONSchema;
  presencePenalty?: number;
  frequencyPenalty?: number;
  thinkingConfig?: {
    includeThoughts?: boolean;
    thinkingLevel?: 'low' | 'medium' | 'high';
  };
};

export type SafetySetting = {
  category: string;
  threshold: string;
};

export type GeminiRequest = {
  contents: Content[];
  systemInstruction?: SystemInstruction;
  generationConfig?: GenerationConfig;
  tools?: Tool[];
  toolConfig?: ToolConfig;
  safetySettings?: SafetySetting[];
  cachedContent?: string;
  labels?: Record<string, string>;
  thinkingLevel?: 'low' | 'medium' | 'high';
  mediaResolution?: 'low' | 'medium' | 'high';
};
