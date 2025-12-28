# Examples for Using the New API Support

This document provides examples of how to use the newly added Anthropic Messages API and OpenAI Responses API support.

## Anthropic Messages API

### Non-Streaming Example

**Request:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "temperature": 0.7,
  "system": "You are a helpful assistant.",
  "messages": [
    {
      "role": "user",
      "content": "What is the capital of France?"
    }
  ]
}
```

**Response:**
```json
{
  "id": "msg_01XYZ",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "The capital of France is Paris."
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 15,
    "output_tokens": 8
  }
}
```

### Streaming Example

When using streaming (`"stream": true`), the response will be sent as Server-Sent Events (SSE):

```
data: {"type":"message_start","message":{"id":"msg_01XYZ","type":"message","role":"assistant","model":"claude-3-5-sonnet-20241022","content":[],"usage":{"input_tokens":15,"output_tokens":0}}}

data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"The"}}

data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" capital"}}

data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" of France is Paris."}}

data: {"type":"content_block_stop","index":0}

data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":8}}

data: {"type":"message_stop"}
```

### Tool Use Example

**Request:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "tools": [
    {
      "name": "get_weather",
      "description": "Get the current weather for a location",
      "input_schema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city name"
          }
        },
        "required": ["location"]
      }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "What's the weather in Paris?"
    }
  ]
}
```

**Response:**
```json
{
  "id": "msg_01ABC",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "I'll check the weather in Paris for you."
    },
    {
      "type": "tool_use",
      "id": "toolu_01DEF",
      "name": "get_weather",
      "input": {
        "location": "Paris"
      }
    }
  ],
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 50,
    "output_tokens": 25
  }
}
```

## OpenAI Responses API

The OpenAI Responses API is designed for structured outputs with strict JSON schema validation.

### Basic Example

**Request:**
```json
{
  "model": "gpt-4o-2024-08-06",
  "input": [
    {
      "role": "user",
      "content": "Solve the equation: 8x + 31 = 2"
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "MathSolution",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "steps": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "explanation": {"type": "string"},
                "output": {"type": "string"}
              },
              "required": ["explanation", "output"]
            }
          },
          "final_answer": {"type": "string"}
        },
        "required": ["steps", "final_answer"]
      }
    }
  }
}
```

**Response:**
```json
{
  "id": "resp_ABC123",
  "object": "response",
  "created": 1234567890,
  "model": "gpt-4o-2024-08-06",
  "output": {
    "steps": [
      {
        "explanation": "Subtract 31 from both sides",
        "output": "8x = -29"
      },
      {
        "explanation": "Divide both sides by 8",
        "output": "x = -3.625"
      }
    ],
    "final_answer": "-3.625"
  },
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 50,
    "total_tokens": 75
  }
}
```

## Configuration

To use this addon with mitmproxy, add it to your config:

```yaml
# ~/.mitmproxy/config.yaml
scripts:
  - /path/to/addon/llm_views.py
```

Or launch mitmweb with the addon:

```bash
mitmweb -s ./addon/llm_views.py
```

**Note:** The single `llm_views.py` file automatically handles all supported LLM APIs - no need to load multiple files!

## API Detection

The addon automatically detects which API is being used based on:

- **Anthropic Messages API**: URL path contains `/messages` and host contains `anthropic`
- **OpenAI Responses API**: URL path contains `/responses` or `/v1/responses`
- **OpenAI Chat Completions API**: URL path ends with `/completions`

The addon intelligently routes requests and responses to the appropriate handler based on these patterns.

## Streaming Support

All three APIs support Server-Sent Events (SSE) streaming:

- **OpenAI Chat Completions**: Aggregates delta content and tool calls
- **Anthropic Messages**: Aggregates content blocks and tool use
- **OpenAI Responses**: Aggregates structured output chunks (newly added!)

The addon automatically detects streaming responses by checking for `text/event-stream` content type.
