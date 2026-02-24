<div align="center">
<img src="src/assets/icon.png" height="20" alt="icon" />
<h1>Mitmproxy LLM Better View</h1>
</div>




**A Tampermonkey script for LLM API Request/Response Visualization in mitmweb.**

<a href="docs/README_CN.md">简体中文README</a>



<details>
  <summary>Screenshots</summary>
  
  *1:*
  ![1](./docs/screenshot1.png)
  *2:*
  ![2](./docs/screenshot2.png)
  *3:*
  ![3](./docs/screenshot3.png)
</details>

## Why Do You Need This?

When using AI applications like `Claude Code` or `OpenCode`, if you can see what context these tools aggregate and input to the LLM, and what the LLM outputs in return, you will better understand how these tools work. You will also gain a clearer idea of what to provide to the LLM to get the results you want.

## Usage

### Step 1. Install mitmproxy

Make sure you have mitmproxy installed.

> mitmweb is the web-based GUI of mitmproxy.

---

### Step 2. Configure the Traffic Flow

Set up your request flow like this:

```
Your Application  →  mitmproxy  →  Target API
```

---

<details>
<summary>opencode / cline / cherrystudio / vercel ai sdk / others</summary>

Most tools provide a configuration option such as `baseURL` (or a similar field).

#### 1️⃣ Configure a Reverse Proxy in mitmweb

Set up a reverse proxy in mitmweb:

![mitmweb-reverse-proxy](./docs/mitmweb-reverse-proxy.png)

#### 2️⃣ Replace the API Endpoint

Update your application's endpoint to point to your mitmproxy reverse proxy address.

⬇️ Take opencode as an example (`~/.config/opencode.jsonc`):

```json
{
  "npm": "@ai-sdk/openai-compatible",
  "options": {
    // "baseURL": "https://api.openai.com/v1/",
    "baseURL": "http://localhost:9091/v1/"
  }
}
```

> ⚠️ Note: The reverse proxy endpoint uses **http**, not https.

</details>

---

<details>
<summary>claude code / gemini-cli (Node.js CLI)</summary>

If you are using a third-party API, the setup is the same as above.

#### 1️⃣ Configure a Reverse Proxy in mitmweb

![mitmweb-reverse-proxy](./docs/mitmweb-reverse-proxy.png)

#### 2️⃣ Replace the Endpoint

⬇️ Take Claude Code as an example:

```bash
# ~/.bashrc or ~/.zshrc

# export ANTHROPIC_BASE_URL="https://your-original-api-endpoint.com/api/coding"
export ANTHROPIC_BASE_URL="http://localhost:9091/api/coding"
```

---

### If You Are Using an Official Claude Plan

Although Claude Code is built on Node.js, you can configure an **explicit HTTP(S) proxy** in mitmweb instead:

![mitmweb-forward-proxy](./docs/mitmweb-forward-proxy.png)

Then set the following environment variables:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0   # Allow insecure certificates
export HTTPS_PROXY=http://127.0.0.1:8080
```

</details>

---

<details>
<summary>codex (Rust CLI)</summary>

If you are using a third-party API, the setup is similar to the previous examples.

#### 1️⃣ Configure a Reverse Proxy in mitmweb

![mitmweb-reverse-proxy](./docs/mitmweb-reverse-proxy.png)

#### 2️⃣ Replace the Base URL

```toml
# ~/.codex/config.toml

[model_providers.your-provider]
name = "your-provider"
# base_url = "https://your-provider-endpoint/api/v1"
base_url = "http://localhost:9091/api/v1"
env_key = "ARK_API_KEY"
wire_api = "chat"
requires_openai_auth = false

[profiles.your-provider-profile]
model = "<Model_Name>"
model_provider = "your-provider"
```

---

#### If You Are Using an Official ChatGPT Plan

```sh
export OPENAI_BASE_URL="https://api.openai.com/v1"
codex
```

ref: https://developers.openai.com/codex/config-advanced/

</details>

---

### Step 3. Install the Tampermonkey Script

If your mitmweb is **not** running on `localhost:8081` or `localhost:9091`, you must manually add a matching rule in the Tampermonkey script, for example:

```js
// @match  http://127.0.0.1:8081/*
```

#### From GreasyFork (Recommended)

Install directly from:  
https://greasyfork.org/scripts/540917-mitmproxy-llm-better-view

#### Manual Installation

Download from the release page and install it manually.

> If mitmweb is not running on ports `8081` or `9090`, you **must** update the matching URL inside the Tampermonkey script.

1. Install the Tampermonkey script  
2. Open mitmweb in your browser  

---

### Step 4. Use and View

Once everything is configured:

1. mitmproxy should capture the requests.
2. Click any captured request.
3. You will see the enhanced panel on the right side.

![view](./docs/view.png)



## Features

- **Request/Response Visualization**: Formatted display of messages, tools, and metadata
- **Multi-Platform Support**: OpenAI Chat Completion, Claude, and Gemini
- **SSE Support**: Handles streaming responses
- **Collapsible Sections**: Fold/unfold messages and tool calls


## Support
- openai
  - /chat/completion api
- gemini
  - /v1beta api
- claude
  - /v1/messages api

### TODO
- Ollama API
- OpenAI Response API


## Notes

This is developed and tested based on the author's usage patterns. It may not cover all API usage scenarios. Please submit an ISSUE to add support for uncovered parameters/types.



## Related Projects

- [mitmproxy](https://mitmproxy.org/) - An interactive TLS-capable intercepting HTTP proxy
- [Tampermonkey](https://www.tampermonkey.net/) - The world's most popular userscript manager
- If you do not want to install the tampermonkey script, you can also use this to visualize req/res online: [ai-api-visualizer](https://github.com/slow-groovin/ai-api-visualizer)

