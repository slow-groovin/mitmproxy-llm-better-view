export type ToolCallFunction = {
  name: string;
  arguments: string;
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: ToolCallFunction;
  index?: number;
};



export type LogProbs = {
  tokens: string[];
  token_logprobs: (number | null)[];
  top_logprobs: (Record<string, number> | null)[];
  text_offset: number[];
};

export type LogitBias = Record<number, number>;

export type Audio = {
  voice?: string;
  format?: string;
};

export type JSONSchema = Record<string, unknown>;
