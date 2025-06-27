To better view request body and response body of LLM API (openai completion) in mitmproxy

![compare](./docs/compare-1.png)

## Quick Start

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

## How It Works

This uses mitmproxy's [contentviews](https://docs.mitmproxy.org/stable/addons/contentviews/) to convert the request body and response content of openai api into Markdown format.
