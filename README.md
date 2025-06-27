# Better view request body and response body of LLM API (openai completion) in mitmproxy

![compare](./docs/compare-1.png)
![](https://raw.githubusercontent.com/slow-groovin/mitmproxy-llm-better-view/refs/heads/main/docs/mitm-better-view.webp)

[中文文档](./docs/README_CN.md)

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
  - <dir path>\addon\openai_req.py
  - <dir path>\addon\openai_res.py
  - <dir path>\addon\openai_res_sse.py
```

> You can also specify the scripts at launch using the `-s` parameter:
> `mitmweb -s .\openai_req.py -s .\openai_res.py -s .\openai_res_sse.py`

### Method 2: Tampermonkey script

visit and install:

https://greasyfork.org/scripts/540917-mitmproxy-llm-better-view

## How It Works
### Method 1: mitmproxy addon scripts

This uses mitmproxy's [contentviews](https://docs.mitmproxy.org/stable/addons/contentviews/) to convert the request body and response content of OpenAI API into Markdown format for better viewing.

### Method 2: Tampermonkey script

Uses JS to fetch data on the page, render it as static HTML, and embed it into the page via an iframe.