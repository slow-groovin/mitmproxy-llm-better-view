import logging
import json
from typing import Any, List

from mitmproxy.contentviews._api import Contentview
from mitmproxy import contentviews
from mitmproxy.http import Response


def multi_line_splitter(line: int) -> str:
    return "\n " * line + "\n"


def indent_text(text: str, n: int) -> str:
    """将多行文本整体缩进 n 个空格"""
    indent = " " * n
    indented_lines = [
        (indent + line) if line.strip() else line for line in text.splitlines()
    ]
    return "\n".join(indented_lines)


split_line = "\n----------------------------------\n"


def handle_response_basis(body: Any) -> str:
    """处理响应的基础信息: id, type, role, model, usage"""
    basic_result = ""
    id = body.get("id", "N/A")
    type_val = body.get("type", "N/A")
    role = body.get("role", "N/A")
    model = body.get("model", "N/A")

    # 获取token使用情况
    usage = body.get("usage", {})
    input_tokens = usage.get("input_tokens", "N/A")
    output_tokens = usage.get("output_tokens", "N/A")

    # 计算所有标签的最大长度，实现右对齐
    labels = ["id", "type", "role", "model", "input_tokens", "output_tokens"]
    max_label_len = max(len(label) for label in labels) + 2

    basic_result += f'{"id":<{max_label_len}}:   {id}\n'
    basic_result += f'{"type":<{max_label_len}}:   {type_val}\n'
    basic_result += f'{"role":<{max_label_len}}:   {role}\n'
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"input_tokens":<{max_label_len}}:   {input_tokens}\n'
    basic_result += f'{"output_tokens":<{max_label_len}}:   {output_tokens}\n'

    return basic_result


def handle_response_content(content: List[Any]) -> str:
    """处理响应内容"""
    content_result = "## Content🔍\n"

    for i, item in enumerate(content):
        item_type = item.get("type", "N/A")
        
        if item_type == "text":
            text = item.get("text", "")
            content_result += f"### 📋Text Block {i}\n"
            content_result += f"{split_line}{indent_text(text, 4)}{split_line}"
        
        elif item_type == "tool_use":
            tool_id = item.get("id", "N/A")
            tool_name = item.get("name", "N/A")
            tool_input = json.dumps(item.get("input", {}), indent=2)
            
            content_result += f"### 🔨Tool Use Block {i}\n"
            content_result += f"ID: {tool_id}\n"
            content_result += f"Name: {tool_name}\n"
            content_result += f"Input:\n{split_line}{indent_text(tool_input, 4)}{split_line}"

    return content_result


def handle_stop_reason(body: Any) -> str:
    """处理停止原因"""
    stop_reason = body.get("stop_reason", None)
    stop_sequence = body.get("stop_sequence", None)
    
    if stop_reason:
        result = f"## Stop Reason🛑\n"
        result += f"Reason: {stop_reason}\n"
        if stop_sequence:
            result += f"Sequence: {stop_sequence}\n"
        return result
    return ""


class AnthropicResp(Contentview):
    name = "Anthropic Response"
    syntax_highlight = "none"

    def prettify(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error in AnthropicResp prettify: {e}")
            return f"Error processing response: {e}"

    def prettify_exec(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        logging.info("prettify Anthropic Response body")
        obj = json.loads(data)

        result = f"# Anthropic Response body\n \n"
        result += handle_response_basis(obj)
        result += multi_line_splitter(2)

        # 处理响应内容
        content = obj.get("content", [])
        if content:
            result += handle_response_content(content)
            result += multi_line_splitter(2)

        # 处理停止原因
        result += handle_stop_reason(obj)

        return result

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if (
            metadata.content_type
            and metadata.content_type.startswith("application/")
            and metadata.content_type.endswith("json")
            and "/messages" in metadata.flow.request.path
            and isinstance(metadata.http_message, Response)
        ):
            # Check if this is an Anthropic API response by looking at the host
            if "anthropic" in metadata.flow.request.host.lower():
                return 2
        return 0


contentviews.add(AnthropicResp)
