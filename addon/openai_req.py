import logging
import json
from typing import Any, List

from mitmproxy.contentviews._api import Contentview
from mitmproxy import contentviews
from mitmproxy.http import Request


def multi_line_splitter(line: int) -> str:
    # 生成line个'\n-'
    return "\n " * line + "\n"


def indent_text(text: str, n: int) -> str:
    """将多行文本整体缩进 n 个空格"""
    if not text:
        return text
    indent = " " * n
    indented_lines = [
        (indent + line) if line.strip() else line for line in text.splitlines()
    ]
    return "\n".join(indented_lines)


split_line = "\n----------------------------------\n"


def handle_request_basis(body: Any) -> str:
    """处理请求的基础信息: model,temperature,stream,messages.length,tools.length"""
    basic_result = ""
    model = body.get("model", "N/A")
    temperature = body.get("temperature", "N/A")
    stream = body.get("stream", "N/A")
    messages_length = len(body.get("messages", []))
    tools_length = len(body.get("tools", []))
    # 计算所有标签的最大长度，实现右对齐
    labels = ["model", "temperature", "stream", "messages", "tools"]
    max_label_len = max(len(label) for label in labels) + 2
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"temperature":<{max_label_len}}:   {temperature}\n'
    basic_result += f'{"stream":<{max_label_len}}:   {stream}\n'
    basic_result += f'{"messages":<{max_label_len}}:   {messages_length}\n'
    basic_result += f'{"tools":<{max_label_len}}:   {tools_length}\n'
    return basic_result


def handle_messages(messages: List[Any]) -> str:
    prompt_result = "## Messages📖\n"
    for i, message in enumerate(messages):
        role = message.get("role")
        content = message.get("content")
        # logging.info(f'🔍[{i}] role: {role}, content: {content}')
        prompt_result += f"### 📋{i}    [role: {role}]\n"
        prompt_result += f"{split_line}{indent_text(content,4)}{split_line}"
    return prompt_result


def handle_tools(tools: List[Any]):
    tool_result = "## Tools🛠️\n"
    for i, tool in enumerate(tools):
        tool_name = tool["function"]["name"]
        tool_desc = tool["function"]["description"]
        tool_result += (
            f"### 🛠️ {tool_name}\n{split_line}{indent_text(tool_desc,4)}{split_line}"
        )
    return tool_result


class OpenaiReq(Contentview):
    name = "Openai Request"
    syntax_highlight = "none"

    def prettify(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error in OpenaiReq prettify: {e}")
            return f"Error processing request: {e}"

    def prettify_exec(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:

        # logging.info('prettify LLM Request body')
        obj = json.loads(data)

        result = "# LLM Request body\n \n"
        result += handle_request_basis(obj)
        result += multi_line_splitter(2)
        # print(obj['messages'])
        result += handle_messages(obj.get("messages", []))
        result += multi_line_splitter(3)
        result += handle_tools(obj.get("tools", []))

        return result

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if (
            metadata.content_type
            and metadata.content_type.startswith("application/")
            and metadata.content_type.endswith("json")
            and metadata.flow.request.path.endswith("completions")
            and isinstance(metadata.http_message, Request)
        ):
            return 2  # return a value > 1 to make sure the custom view is automatically selected
        else:
            return 0


contentviews.add(OpenaiReq)
