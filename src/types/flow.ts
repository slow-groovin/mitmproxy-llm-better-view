// API 标准标识：openai-response 与 openai-chat 独立分流，避免混用。
export type ApiStandard = 'openai' | 'openai-response' | 'claude' | 'gemini';
export type DataType = 'request' | 'response' | 'sse';

export type CallAction = { uuid: string, action: 'request' | 'response' }
export type Flow = {
  id: string;
  intercepted: boolean;
  is_replay: null;
  type: "http";
  modified: boolean;
  marked: string;
  comment: string;
  timestamp_created: number;
  request: {
    method: string;
    scheme: string;
    host: string;
    port: number;
    path: string;
    http_version: string;
    headers: Array<[string, string[]]>;
    contentLength: number;
    contentHash: string;
    timestamp_start: number;
    timestamp_end: number;
    pretty_host: string;
  };
  response: {
    http_version: string;
    status_code: number;
    reason: string;
    headers: Array<[string, string[]]>;
    contentLength: number;
    contentHash: string;
    timestamp_start: number;
    timestamp_end: number;
  };
};
