# Better view request body and response body of LLM APIs in mitmproxy

Support for OpenAI Chat Completions, OpenAI Responses API, and Anthropic Messages API.

![compare](./docs/compare-1.png)
![](https://raw.githubusercontent.com/slow-groovin/mitmproxy-llm-better-view/refs/heads/main/docs/mitm-better-view.webp)

[中文文档](./docs/README_CN.md) | [Examples](./EXAMPLES.md)

## Quick Start
This project provides two tools (**The two are conflicting**):
1. mitmproxy addon scripts, which can be added when executing mitmproxy/mitmweb
2. (mitmweb only) Tampermonkey script

### Method 1: mitmproxy addon scripts

```bash
git clone https://github.com/slow-groovin/mitmproxy-llm-better-view.git
```

Add persistent configuration in `~/.mitmproxy/config.yaml`:

```yaml
# ... your other configs
scripts:
  - <dir path>/addon/llm_views.py
```

> You can also specify the script at launch using the `-s` parameter:
> ```bash
> mitmweb -s ./addon/llm_views.py
> ```

**Note:** The single `llm_views.py` file automatically handles all supported LLM APIs:
- OpenAI Chat Completions (streaming & non-streaming)
- OpenAI Responses API (streaming & non-streaming)
- Anthropic Messages API (streaming & non-streaming)

### Method 2: Tampermonkey script

visit and install:

https://greasyfork.org/scripts/540917-mitmproxy-llm-better-view

## How It Works
### Method 1: mitmproxy addon scripts

This uses mitmproxy's [contentviews](https://docs.mitmproxy.org/stable/addons/contentviews/) to convert the request body and response content of LLM APIs into Markdown format for better viewing.

#### Supported APIs:
- **OpenAI Chat Completions API** (`/v1/chat/completions`): Full support for streaming and non-streaming requests
- **Anthropic Messages API** (`/v1/messages`): Full support for streaming and non-streaming requests, including tool use
- **OpenAI Responses API** (`/v1/responses`): Support for structured outputs with JSON schemas, **including streaming (SSE) support**

### Method 2: Tampermonkey script

Uses JS to fetch data on the page, render it as static HTML, and embed it into the page via an iframe.

## Features

### OpenAI Chat Completions API Support
- Request body parsing with model, temperature, messages, and tools
- Response parsing for both streaming (SSE) and non-streaming formats
- Tool calls and function calling support
- Reasoning content support (for models like o1)

### Anthropic Messages API Support
- Request body parsing with model, max_tokens, system prompts, and messages
- Response parsing for both streaming (SSE) and non-streaming formats
- Multi-modal content support (text, images, tool use, tool results)
- Tool definitions and tool use tracking
- Stop reasons and stop sequences

### OpenAI Responses API Support
- Request body parsing with structured input and response format schemas
- Response parsing with structured outputs (streaming and non-streaming)
- JSON schema validation support
- Token usage tracking
- **Full SSE streaming support** for real-time structured output delivery