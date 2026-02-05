import type { GeminiRequest } from './request';
import type { GeminiResponse } from './response';
import type { SSEEvent } from './sse';

// Test request type
const geminiRequest: GeminiRequest =
{
  "generationConfig": {
    "maxOutputTokens": 32000,
    "topK": 64,
    "topP": 0.95,
    "thinkingConfig": {
      "includeThoughts": true,
      "thinkingLevel": "high"
    }
  },
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "hello!"
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "text": "**Acknowledge User's Greeting**\n\nI've registered",
          "thought": true
        },
        {
          "text": "Hello!"
        }
      ]
    },
    {
      "role": "user",
      "parts": [
        {
          "text": "方的)"
        },
        {
          "text": "Called the Read tool with the following input: {\"filePath\":\"/homejudge.ts\"}"
        },
        {
          "text": "<file>\n00001| import { Flow } f...</file>"
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "text": "**Analyzing Gemini Request Detection**\n\nI'm.",
          "thought": true
        },
        {
          "text": "I will improve the."
        },
        {
          "functionCall": {
            "name": "grep",
            "args": {
              "pattern": "Gemini"
            }
          },
          "thoughtSignature": "EtNh="
        }
      ]
    },
    {
      "role": "user",
      "parts": [
        {
          "functionResponse": {
            "name": "grep",
            "response": {
              "name": "grep",
              "content": "Found 12 matches\n/homexxxcandidates"
            }
          }
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "text": "**Confirming Key Functions**\n",
          "thought": true
        },
        {
          "text": "I've updated `isGeminiPath>>>>\n```"
        },
        {
          "functionCall": {
            "name": "edit",
            "args": {
              "oldString": "function isGeminiPath",
              "filePath": "/llm/judge.ts",
              "newString": "function isGeminiPath(flow: Flow): boolean {\n"
            }
          },
          "thoughtSignature": "vg=="
        }
      ]
    },
    {
      "role": "user",
      "parts": [
        {
          "functionResponse": {
            "name": "edit",
            "response": {
              "name": "edit",
              "content": "Edit applied successfully."
            }
          }
        }
      ]
    },
    {
      "role": "user",
      "parts": [
        {
          "functionResponse": {
            "name": "grep",
            "response": {
              "name": "grep",
              "content": "No files found"
            }
          }
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "text": "I have updated ."
        }
      ]
    }
  ],
  "systemInstruction": {
    "parts": [
      {
        "text": "You are "
      }
    ]
  },
  "tools": [
    {
      "functionDeclarations": [
        {
          "name": "webfetch",
          "description": "- Fetches content from a specified URL",
          "parameters": {
            "required": [
              "url",
              "format"
            ],
            "type": "object",
            "properties": {
              "url": {
                "description": "The URL to fetch content from",
                "type": "string"
              },
              "format": {
                "description": "The format to return the content in (text, markdown, or html). Defaults to markdown.",
                "type": "string",
                "enum": [
                  "text",
                  "markdown",
                  "html"
                ]
              },
              "timeout": {
                "description": "Optional timeout in seconds (max 120)",
                "type": "number"
              }
            }
          }
        },
        {
          "name": "todowrite",
          "description": "Use this tool to create and manage a structured task list for your current c\n\n",
          "parameters": {
            "required": [
              "todos"
            ],
            "type": "object",
            "properties": {
              "todos": {
                "description": "The updated todo list",
                "type": "array",
                "items": {
                  "required": [
                    "content",
                    "status",
                    "priority",
                    "id"
                  ],
                  "type": "object",
                  "properties": {
                    "content": {
                      "description": "Brief description of the task",
                      "type": "string"
                    },
                    "status": {
                      "description": "Current status of the task: pending, in_progress, completed, cancelled",
                      "type": "string"
                    },
                    "priority": {
                      "description": "Priority level of the task: high, medium, low",
                      "type": "string"
                    },
                    "id": {
                      "description": "Unique identifier for the todo item",
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        },
        {
          "name": "todoread",
          "description": "Use this tool to read your todo list"
        },
        {
          "name": "context7_query-docs",
          "description": "Retrieves and queries up-to-date documentation and code examples from Context7 .",
          "parameters": {
            "required": [
              "libraryId",
              "query"
            ],
            "type": "object",
            "properties": {
              "libraryId": {
                "description": "Exact Context7-compatible library ID",
                "type": "string"
              },
              "query": {
                "description": "The question or task you need help with. ",
                "type": "string"
              }
            }
          }
        }
      ]
    }
  ],
  "toolConfig": {
    "functionCallingConfig": {
      "mode": "AUTO"
    }
  }
};

// Test response type
const geminiResponse: GeminiResponse = 
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "functionCall": {
              "name": "mcp__CherryFetch__fetchHtml",
              "args": {
                "url": "https://www.google.cn/home"
              }
            }
          },
          {
            "functionCall": {
              "name": "mcp__CherryFetch__fetchHtml",
              "args": {
                "url": "https://www.google.cn/home"
              }
            }
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0,
      "finishMessage": "Model generated function call(s)."
    },
    {
      "content": {
        "parts": [
          {
            "text": "您好，我为您两次调用了 `fetchHtml` 来获取 。"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 1173,
    "candidatesTokenCount": 201,
    "totalTokenCount": 1374,
    "promptTokensDetails": [
      {
        "modality": "TEXT",
        "tokenCount": 1173
      }
    ]
  },
  "modelVersion": "gemini-2.5-flash-lite-preview-09-2025",
  "responseId": "ci-EabKmGfLoz7IP757r-QM"
};

// Test SSE event type (from gemini-sse.ndjson sample)
const sseEvent1: SSEEvent = {
  nonce: '749ff25beb',
  candidates: [
    {
      content: {
        parts: [
          {
            text: '**Verifying Initial St*any* type.\n\n\n',
            thought: true,
          },
        ],
        role: 'model',
      },
      index: 0,
    },
  ],
  usageMetadata: {
    promptTokenCount: 20932,
    totalTokenCount: 20932,
    promptTokensDetails: [
      {
        modality: 'TEXT',
        tokenCount: 20932,
      },
    ],
  },
  modelVersion: 'gemini-3-flash-preview',
  responseId: 'hvyDacbXC5OFz7IPs7mb4Ak',
};

const sseEvent2: SSEEvent = {
  nonce: '3fa8',
  candidates: [
    {
      content: {
        parts: [
          {
            functionCall: {
              name: 'grep',
              args: {
                pattern: 'judgeGeminiRequest',
              },
            },
            thoughtSignature: 'EtQGCtEGAb4+9vtJqKCEnlpSaBMmv/CAq8SsrKq8so21v6HhNii55m8fmRT6GWJBr',
          },
        ],
        role: 'model',
      },
      index: 0,
    },
  ],
  usageMetadata: {
    promptTokenCount: 20932,
    candidatesTokenCount: 17,
    totalTokenCount: 21134,
    promptTokensDetails: [
      {
        modality: 'TEXT',
        tokenCount: 20932,
      },
    ],
    thoughtsTokenCount: 185,
  },
  modelVersion: 'gemini-3-flash-preview',
  responseId: 'hvyDacbXC5OFz7IPs7mb4Ak',
};

const sseEvent3: SSEEvent = {
  nonce: 'fd8684c1f8',
  candidates: [
    {
      content: {
        parts: [
          {
            text: '',
          },
        ],
        role: 'model',
      },
      finishReason: 'STOP',
      index: 0,
    },
  ],
  usageMetadata: {
    promptTokenCount: 24747,
    candidatesTokenCount: 17,
    totalTokenCount: 24949,
    cachedContentTokenCount: 17332,
    promptTokensDetails: [
      {
        modality: 'TEXT',
        tokenCount: 24747,
      },
    ],
    cacheTokensDetails: [
      {
        modality: 'TEXT',
        tokenCount: 17332,
      },
    ],
    thoughtsTokenCount: 185,
  },
  modelVersion: 'gemini-3-flash-preview',
  responseId: 'hvyDacbXC5OFz7IPs7mb4Ak',
};

// Export to ensure unused variables don't cause errors
export const typesTest = { geminiRequest, geminiResponse, sseEvent1, sseEvent2, sseEvent3 };
