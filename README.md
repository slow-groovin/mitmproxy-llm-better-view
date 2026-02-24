<div align="center">
<img src="src/assets/icon.png" height="20" alt="icon" />
<h1>Mitmproxy LLM Better View</h1>
</div>




**A Tampermonkey script for LLM API Request/Response Visualization in mitmweb.**

<a href="docs/README_CN.md">简体中文README</a>



<details>
  <summary>Screenshots</summary>
  
  *Screenshot1:*
  ![1](./docs/screenshot1.png)
  *Screenshot2:*
  ![2](./docs/screenshot2.png)
  *Screenshot3:*
  ![3](./docs/screenshot3.png)
</details>


## Usage
### Step 1. Install Mitmproxy


### Step 2. Config: application's http request  ----->  mitmproxy -----> target
> mitmweb is the web GUI of mitmproxy



<details>
<summary>opencode/cline/cherrystudio/vercel ai sdk/others</summary>
It's easy.
There is a config like `baseURL` or something like it.

**Firstly, config a reverse proxy in mitmweb**
![mitmweb-reverse-proxy](./docs/mitmweb-reverse-proxy.png)

**Then replace the endpoint to your mitmproxy's reverse proxy endpoint**

⬇️Take opencode as example(~/.config/opencode.jsonc):

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
<summary>claude code/ gemini-cli (Nodejs CLI)</summary>
If you use third-party api, it's like opencode


**Firstly, config a reverse proxy in mitmweb**
![mitmweb-reverse-proxy](./docs/mitmweb-reverse-proxy.png)

**Then replace the endpoint to your mitmproxy's reverse proxy endpoint**

⬇️Take claude code as example:
```sh
# ~/.bashrc or ~/.zshrc
#export ANTHROPIC_BASE_URL="https://your-origin-api-endpoint.com/api/coding"
export ANTHROPIC_BASE_URL="http://localhost:9091/api/coding"
```

If you use claude plan, though claude code is built on nodejs, you can config **Explicit HTTP(S) Proxy** in mitmweb:

![mitmweb-forward-proxy](./docs/mitmweb-forward-proxy.png)

and set env for 

```sh
export NODE_TLS_REJECT_UNAUTHORIZED=0  #allow insecure cert
export HTTPS_PROXY=http://127.0.0.1:8080 #proxy endpoint
```
</details>


<details>
<summary>codex (Rust CLI)</summary>

If you use third-party api, it's like opencode


**Firstly, config a reverse proxy in mitmweb**
![mitmweb-reverse-proxy](./docs/mitmweb-reverse-proxy.png)

**Then replace the endpoint to your mitmproxy's reverse proxy endpoint**

```toml
# ~/.codex/config.toml
[model_providers.your-provider]  
name = "your-provider"  
#base_url = "https://your-provider-endpoint/api/v1"  
base_url = "http://localhost:9091/api/v1"  
env_key = "ARK_API_KEY"
wire_api = "chat" 
requires_openai_auth = false
 
 
[profiles.your-provider-profile]
model = "<Model_Name>"
model_provider = "your-provider"
```


If you use official chatgpt plan, it's a big trouble, because codex is built on rust, you cannot use env var like `export NODE_TLS_REJECT_UNAUTHORIZED=0` to skip insecure cert. You may try to trust local trust cert to skip. 
</details>




### Step 3. Install the Tampermonkey script

#### From GreasyFork (Recommended)

Install directly from: https://greasyfork.org/scripts/540917-mitmproxy-llm-better-view


#### Manual Install 
Download from release, and install mannually
> If you’re not running mitmweb on ports 8081 or 9090, then you **must** change the Tampermonkey script’s matching URL to the address you’re using.

1. Install the Tampermonkey script
2. Open mitmweb in your browser
  
### Step 4. Use and view
Your mitmproxy should capture the request, and click it, you will see the panel in the right
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

