<div align="center">
  <img src="src/assets/icon-raw.png" height="24" alt="icon" />
  <span style="vertical-align: middle; font-size: 24px;"> Mitmproxy LLM Better View</span>
</div>



A Tampermonkey script for LLM API Request/Response Visualization in mitmweb.

*Screenshot1:*
![1](./docs/screenshot1.png)

<details>
  <summary>More Screenshots</summary>
  

  *Screenshot2:*
  ![2](./docs/screenshot2.png)
  *Screenshot3:*
  ![3](./docs/screenshot3.png)
</details>

<a href="docs/README_CN.md">简体中文README</a>

## Features

- **Request/Response Visualization**: Formatted display of messages, tools, and metadata
- **Multi-Platform Support**: OpenAI Chat Completion, Claude, and Gemini
- **SSE Support**: Handles streaming responses
- **Collapsible Sections**: Fold/unfold messages and tool calls

## Installation
> If you’re not running mitmweb on ports 8081 or 9090, then you **must** change the Tampermonkey script’s matching URL to the address you’re using.


### From GreasyFork (Recommended)

Install directly from: https://greasyfork.org/scripts/540917-mitmproxy-llm-better-view


### Manual Install 
Download from release, and install mannually

### Manual Build

```bash
# Clone the repository
git clone https://github.com/slow-groovin/mitmproxy-llm-better-view.git
cd mitmproxy-llm-better-view

# Install dependencies
npm install

# Build the script
npm run build

# The output will be in dist/mitmproxy-llm-better-view.user.js
```

## Usage

1. Install the Tampermonkey script
2. Open mitmweb in your browser
3. Click on any LLM API request/response to see the enhanced view

## Development

```bash
# Start development server with hot reload
npm run dev
```

## Notes

This is developed and tested based on the author's usage patterns. It may not cover all API usage scenarios. Please submit an ISSUE to add support for uncovered parameters/types.

## Future Plans

- Ollama API
- OpenAI Response API

## Related Projects

- [mitmproxy](https://mitmproxy.org/) - An interactive TLS-capable intercepting HTTP proxy
- [Tampermonkey](https://www.tampermonkey.net/) - The world's most popular userscript manager
