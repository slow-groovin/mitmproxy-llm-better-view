import logging
import json
from typing import Any, List

from mitmproxy.contentviews._api import Contentview
from mitmproxy import contentviews
from mitmproxy.http import Request


def multi_line_splitter(line: int) -> str:
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
    """处理请求的基础信息: model, max_tokens, temperature, stream, messages.length"""
    basic_result = ""
    model = body.get("model", "N/A")
    max_tokens = body.get("max_tokens", "N/A")
    temperature = body.get("temperature", "N/A")
    stream = body.get("stream", "N/A")
    messages_length = len(body.get("messages", []))
    
    # 计算所有标签的最大长度，实现右对齐
    labels = ["model", "max_tokens", "temperature", "stream", "messages"]
    max_label_len = max(len(label) for label in labels) + 2
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"max_tokens":<{max_label_len}}:   {max_tokens}\n'
    basic_result += f'{"temperature":<{max_label_len}}:   {temperature}\n'
    basic_result += f'{"stream":<{max_label_len}}:   {stream}\n'
    basic_result += f'{"messages":<{max_label_len}}:   {messages_length}\n'
    return basic_result


def handle_system_prompt(system: str) -> str:
    """处理系统提示词"""
    if system:
        return f"## System Prompt📌\n{split_line}{indent_text(system, 4)}{split_line}"
    return ""


def handle_messages(messages: List[Any]) -> str:
    """处理消息列表"""
    prompt_result = "## Messages📖\n"
    for i, message in enumerate(messages):
        role = message.get("role")
        content = message.get("content")
        
        # 处理 content 可能是字符串或数组的情况
        if isinstance(content, list):
            content_text = ""
            for item in content:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        content_text += item.get("text", "")
                    elif item.get("type") == "image":
                        content_text += f"[Image: {item.get('source', {}).get('type', 'unknown')}]\n"
                    elif item.get("type") == "tool_use":
                        tool_name = item.get("name", "N/A")
                        tool_input = json.dumps(item.get("input", {}), indent=2)
                        content_text += f"[Tool Use: {tool_name}]\nInput:\n{tool_input}\n"
                    elif item.get("type") == "tool_result":
                        tool_use_id = item.get("tool_use_id", "N/A")
                        tool_content = item.get("content", "N/A")
                        content_text += f"[Tool Result for: {tool_use_id}]\n{tool_content}\n"
            content = content_text
        
        prompt_result += f"### 📋{i}    [role: {role}]\n"
        prompt_result += f"{split_line}{indent_text(str(content), 4)}{split_line}"
    return prompt_result


def handle_tools(tools: List[Any]) -> str:
    """处理工具定义"""
    if not tools:
        return ""
    
    tool_result = "## Tools🛠️\n"
    for i, tool in enumerate(tools):
        tool_name = tool.get("name", "N/A")
        tool_desc = tool.get("description", "N/A")
        input_schema = json.dumps(tool.get("input_schema", {}), indent=2)
        tool_result += f"### 🛠️ {tool_name}\n"
        tool_result += f"{split_line}{indent_text(tool_desc, 4)}{split_line}"
        tool_result += f"#### Input Schema\n"
        tool_result += f"{split_line}{indent_text(input_schema, 4)}{split_line}"
    return tool_result


class AnthropicReq(Contentview):
    name = "Anthropic Request"
    syntax_highlight = "none"

    def prettify(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error in AnthropicReq prettify: {e}")
            return f"Error processing request: {e}"

    def prettify_exec(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        obj = json.loads(data)

        result = "# Anthropic Request body\n \n"
        result += handle_request_basis(obj)
        result += multi_line_splitter(2)
        
        # 处理系统提示词（Anthropic 特有的独立字段）
        system = obj.get("system", "")
        if system:
            result += handle_system_prompt(system)
            result += multi_line_splitter(2)
        
        # 处理消息
        result += handle_messages(obj.get("messages", []))
        result += multi_line_splitter(3)
        
        # 处理工具
        result += handle_tools(obj.get("tools", []))

        return result

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if (
            metadata.content_type
            and metadata.content_type.startswith("application/")
            and metadata.content_type.endswith("json")
            and "/messages" in metadata.flow.request.path
            and isinstance(metadata.http_message, Request)
        ):
            # Check if this is an Anthropic API request by looking at the host
            if "anthropic" in metadata.flow.request.host.lower():
                return 2
        return 0


contentviews.add(AnthropicReq)
