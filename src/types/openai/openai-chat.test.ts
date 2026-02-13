import type { OpenaiChatRequest } from './chat-request';
import type { OpenaiChatResponse } from './chat-response';
import type { OpenaiChatCompletionChunk } from './chat-sse';

// Test request type
//@ts-ignore
const openAiChatRequest: OpenaiChatRequest =
{
  "model": "glm-4-7",
  "max_tokens": 32000,
  "messages": [
    {
      "role": "system",
      "content": "You are opencode, an interx,"
    },
    {
      "role": "user",
      "content": "参考..."
    },
    {
      "role": "user",
      "content": "继续"
    },
    {
      "role": "assistant",
      "content": "",
      "tool_calls": [
        {
          "id": "Run91234",
          "type": "function",
          "function": {
            "name": "glob",
            "arguments": "{\"pattern\":\"**/*\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "Run91234",
      "content": "\n \n App.vue\n\n(Results are truncated. Consider using a more specific path or pattern.)" //toolcall的 result可以是 纯文本, 很多换行符,  也可以是json
    },
    {
      "role": "assistant",
      "content": "",
      "tool_calls": [
        {
          "id": "n9Iwurun9Iwur",
          "type": "function",
          "function": {
            "name": "read",
            "arguments": "{\"filePath\":\"xxx/src/old/index.ts\"}"  //tool_call的 arguments 可以是json也可以是text
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "n9Iwurun9Iwur",
      "content": "<file>\n00001| xxxx" //纯文本
    },
    {
      "role": "user",
      "content": "继续"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "question",
        "description": "Use this tool when you need\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "questions": {
              "description": "Questions to ask",
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "question": {
                    "description": "Complete question",
                    "type": "string"
                  },
                  "header": {
                    "description": "Very short label (max 30 chars)",
                    "type": "string",
                    "maxLength": 30
                  },
                  "options": {
                    "description": "Available choices",
                    "type": "array",
                    "items": {
                      "ref": "QuestionOption",
                      "type": "object",
                      "properties": {
                        "label": {
                          "description": "Display text (1-5 words, concise)",
                          "type": "string",
                          "maxLength": 30
                        },
                        "description": {
                          "description": "Explanation of choice",
                          "type": "string"
                        }
                      },
                      "required": [
                        "label",
                        "description"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "multiple": {
                    "description": "Allow selecting multiple choices",
                    "type": "boolean"
                  }
                },
                "required": [
                  "question",
                  "header",
                  "options"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "questions"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Executes a given bash command in a persi\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "command": {
              "description": "The command to execute",
              "type": "string"
            },
            "timeout": {
              "description": "Optional timeout in milliseconds",
              "type": "number"
            },
            "workdir": {
              "description": "The working directory to run the command in. Defaults to /home/user12345/code/repo/mitmproxy-llm-better-view. Use this instead of 'cd' commands.",
              "type": "string"
            },
            "description": {
              "description": "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: Lists files in cu 'foo'",
              "type": "string"
            }
          },
          "required": [
            "command",
            "description"
          ],
          "additionalProperties": false
        }
      }
    }
    //....
  ],
  "tool_choice": "auto",
  "stream": true,
  "stream_options": {
    "include_usage": true
  }
}

// Test response type
//@ts-ignore
const openaiChatResponse: OpenaiChatResponse =
{
  "id": "chatcmpl-202602051245174057519",
  "model": "gemini-flash-latest",
  "object": "chat.completion",
  "created": 1770266718,
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "",
        "tool_calls": [
          {
            "id": "call_f02de592ba7c4015ab10dffc5528f98c",
            "type": "function",
            "function": {
              "name": "mcp__CherryFetch__fetchHtml",
              "arguments": "{\"url\":\"https://www.agent.md/home\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 1450,
    "completion_tokens": 33,
    "total_tokens": 1483,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "text_tokens": 1450,
      "audio_tokens": 0,
      "image_tokens": 0
    },
    "completion_tokens_details": {
      "text_tokens": 0,
      "audio_tokens": 0,
      "reasoning_tokens": 0
    },
    "input_tokens": 0,
    "output_tokens": 0,
    "input_tokens_details": null,
    "claude_cache_creation_5_m_tokens": 0,
    "claude_cache_creation_1_h_tokens": 0
  }
}


// Test SSE event type (from gemini-sse.ndjson sample)
//@ts-ignore
const openAISSE: OpenaiChatCompletionChunk[] = [

  { "choices": [{ "delta": { "content": "", "reasoning_content": "现在我", "role": "assistant" }, "index": 0 }], "created": 1770261425, "id": "0217702", "model": "glm-4-7", "service_tier": "default", "object": "chat.completion.chunk", "usage": null },
  { "choices": [{ "delta": { "content": "", "reasoning_content": "需要", "role": "assistant" }, "index": 0 }], "created": 1770261425, "id": "0217702", "model": "glm-4-7", "service_tier": "default", "object": "chat.completion.chunk", "usage": null },

  { "choices": [{ "delta": { "content": "", "role": "assistant", "tool_calls": [{ "function": { "arguments": "{", "name": "write" }, "id": "call_f2d2ane0oev8dwyhjt9vykeq", "index": 0, "type": "function" }] }, "index": 0 }], "created": 1770261425, "id": "0217702", "model": "glm-4-7", "service_tier": "default", "object": "chat.completion.chunk", "usage": null },

  { "choices": [{ "delta": { "content": "", "role": "assistant" }, "finish_reason": "tool_calls", "index": 0 }], "created": 1770261425, "id": "0217702", "model": "glm-4-7", "service_tier": "default", "object": "chat.completion.chunk", "usage": null },

  { "choices": [], "created": 1770262125, "id": "0217702", "model": "glm-4-7", "service_tier": "default", "object": "chat.completion.chunk", "usage": { "completion_tokens": 563, "prompt_tokens": 23159, "total_tokens": 23722, "prompt_tokens_details": { "cached_tokens": 18688 }, "completion_tokens_details": { "reasoning_tokens": 141 } } }

]
