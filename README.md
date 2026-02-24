<div align="center">
<img src="src/assets/icon.png" height="20" alt="icon" />
<h1>Mitmproxy LLM Better View</h1>
</div>




**A Tampermonkey script for LLM API Request/Response Visualization in mitmweb.**

<a href="docs/README_CN.md">简体中文README</a>


*Screenshot1:*
![1](./docs/screenshot1.png)

<details>
  <summary>More Screenshots</summary>
  

  *Screenshot2:*
  ![2](./docs/screenshot2.png)
  *Screenshot3:*
  ![3](./docs/screenshot3.png)
</details>


## Usage
### Step 1. Install Mitmproxy


### Step 2. Config: application's http request  ----->  mitmproxy's reverse proxy  -----> target
> mitmweb is the web GUI of mitmproxy

**Firstly, config a reverse proxy in mitmweb**


<details>
<summary>opencode/cline/cherrystudio/vercel ai sdk/others</summary>
It's easy.
There is a config like `baseURL` or something like it.
Just replace it to your mitmproxy's reverse proxy endpoint

```json
{
  "npm": "@ai-sdk/openai-compatible",
  "options": {
    // "baseURL": "https://api.openai.com/v1/",
    "basURL": "http://localhost:9091/v1/",
  },
}
```
> Notice the reverse proxy endpoint's schema is **http** 

</details>


<details>
<summary>claude code</summary>
If you use third-party api, it's like opencode

```sh
#export ANTHROPIC_BASE_URL="https://your-origin-api-endpoint.com/api/coding"
export ANTHROPIC_BASE_URL="http://localhost:9091/api/coding"
```

If you use claude plan, because claude code is built on nodejs, you can config **Explicit HTTP(S) Proxy (With Upstream Proxy)** in mitmweb and try this:
```sh
export NODE_TLS_REJECT_UNAUTHORIZED=0
export HTTPS_PROXY=http://127.0.0.1:8080
```
HTTPS_PROXY endpoint is **NOT** the reverse proxy configed before, but a new config

TODO: img hhere
</details>


<details>
<summary>codex code</summary>
TODO
</details>


<details>
<summary>gemini cli</summary>
TODO
</details>

### Step 3. Install the Tampermonkey script

#### From GreasyFork (Recommended)

Install directly from: https://greasyfork.org/scripts/540917-mitmproxy-llm-better-view


#### Manual Install 
Download from release, and install mannually
> If you’re not running mitmweb on ports 8081 or 9090, then you **must** change the Tampermonkey script’s matching URL to the address you’re using.

1. Install the Tampermonkey script
2. Open mitmweb in your browser
### Step 4. Click on any LLM API request/response to see the enhanced view









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
  - api

### Future Plans
- Ollama API
- OpenAI Response API

## Notes

This is developed and tested based on the author's usage patterns. It may not cover all API usage scenarios. Please submit an ISSUE to add support for uncovered parameters/types.



## Related Projects

- [mitmproxy](https://mitmproxy.org/) - An interactive TLS-capable intercepting HTTP proxy
- [Tampermonkey](https://www.tampermonkey.net/) - The world's most popular userscript manager

