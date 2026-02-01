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
    headers: Array<Record<string, string>>;
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
    headers: Array<Record<string, string>>;
    contentLength: number;
    contentHash: string;
    timestamp_start: number;
    timestamp_end: number;
  };
};
