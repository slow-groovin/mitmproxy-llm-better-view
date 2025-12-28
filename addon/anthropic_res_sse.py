import logging
import json
from typing import Any, List, Dict
import traceback

from mitmproxy.contentviews._api import Contentview
from mitmproxy import contentviews
from mitmproxy.http import Response


def multi_line_splitter(line: int) -> str:
    """生成分割线"""
    return "\n " * line + "\n"


def indent_text(text: str, n: int) -> str:
    """将多行文本整体缩进 n 个空格"""
    indent = " " * n
    # 确保在缩进前先尝试美化JSON字符串
    try:
        parsed_json = json.loads(text)
        text = json.dumps(parsed_json, indent=4, ensure_ascii=False)
    except json.JSONDecodeError:
        # 如果不是有效的JSON，则保持原样
        pass
    indented_lines = [
        (indent + line) if line.strip() else line for line in text.splitlines()
    ]
    return "\n".join(indented_lines)


split_line = "\n----------------------------------\n"


def handle_response_basis(body: Dict[str, Any]) -> str:
    """处理响应的基础信息: id, type, role, model, usage"""
    basic_result = ""
    id = body.get("id", "N/A")
    type_val = body.get("type", "N/A")
    role = body.get("role", "N/A")
    model = body.get("model", "N/A")

    # 获取token使用情况
    usage = body.get("usage", {})
    input_tokens = usage and usage.get("input_tokens", "N/A")
    output_tokens = usage and usage.get("output_tokens", "N/A")

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


def parse_sse_data(data: bytes) -> List[Dict[str, Any]]:
    """解析SSE格式的数据流"""
    events = []
    text = data.decode("utf-8", errors="replace")

    # 按行分割
    lines = text.split("\n")

    for line in lines:
        line = line.strip()
        if line.startswith("data: "):
            data_content = line[6:]

            if data_content == "[DONE]":
                continue

            try:
                json_data = json.loads(data_content)
                events.append(json_data)
            except json.JSONDecodeError:
                logging.warning(f"Could not decode SSE JSON data: {data_content}")
    return events


def handle_sse_content(events: List[Dict[str, Any]]) -> str:
    """
    处理和聚合SSE事件流中的所有内容块，包括文本和工具调用。

    Args:
        events: 解析后的SSE事件列表。

    Returns:
        格式化后的字符串，展示所有聚合后的内容。
    """
    # aggregated_content 的结构:
    # {
    #   content_index: {
    #     "type": "text" | "tool_use",
    #     "text": "...",  # for text blocks
    #     "id": "...",    # for tool_use blocks
    #     "name": "...",  # for tool_use blocks
    #     "input": "..."  # for tool_use blocks (JSON string)
    #   }
    # }
    aggregated_content: Dict[int, Dict[str, Any]] = {}

    for event in events:
        event_type = event.get("type")
        
        if event_type == "content_block_start":
            index = event.get("index", 0)
            content_block = event.get("content_block", {})
            block_type = content_block.get("type")
            
            if index not in aggregated_content:
                aggregated_content[index] = {
                    "type": block_type
                }
            
            if block_type == "text":
                aggregated_content[index]["text"] = content_block.get("text", "")
            elif block_type == "tool_use":
                aggregated_content[index]["id"] = content_block.get("id", "")
                aggregated_content[index]["name"] = content_block.get("name", "")
                aggregated_content[index]["input"] = ""
        
        elif event_type == "content_block_delta":
            index = event.get("index", 0)
            delta = event.get("delta", {})
            delta_type = delta.get("type")
            
            if index not in aggregated_content:
                aggregated_content[index] = {"type": delta_type}
            
            if delta_type == "text_delta":
                if "text" not in aggregated_content[index]:
                    aggregated_content[index]["text"] = ""
                aggregated_content[index]["text"] += delta.get("text", "")
            
            elif delta_type == "input_json_delta":
                if "input" not in aggregated_content[index]:
                    aggregated_content[index]["input"] = ""
                aggregated_content[index]["input"] += delta.get("partial_json", "")

    # 格式化输出
    content_result = "## Content🔍\n"
    for index, block_data in sorted(aggregated_content.items()):
        block_type = block_data.get("type", "N/A")
        
        if block_type == "text":
            text = block_data.get("text", "").strip()
            if text:
                content_result += f"### 📋Text Block {index}\n"
                content_result += f"{split_line}{indent_text(text, 4)}{split_line}"
        
        elif block_type == "tool_use":
            tool_id = block_data.get("id", "N/A")
            tool_name = block_data.get("name", "N/A")
            tool_input = block_data.get("input", "{}")
            
            content_result += f"### 🔨Tool Use Block {index}\n"
            content_result += f"ID: {tool_id}\n"
            content_result += f"Name: {tool_name}\n"
            content_result += f"Input:\n{split_line}{indent_text(tool_input, 4)}{split_line}"

    return content_result


def handle_stop_reason(events: List[Dict[str, Any]]) -> str:
    """从事件流中提取停止原因"""
    for event in reversed(events):
        if event.get("type") == "message_delta":
            delta = event.get("delta", {})
            stop_reason = delta.get("stop_reason")
            stop_sequence = delta.get("stop_sequence")
            
            if stop_reason:
                result = f"## Stop Reason🛑\n"
                result += f"Reason: {stop_reason}\n"
                if stop_sequence:
                    result += f"Sequence: {stop_sequence}\n"
                return result
    return ""


class AnthropicRespSSE(Contentview):
    name = "Anthropic SSE Response"
    syntax_highlight = "none"

    def prettify(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error prettifying Anthropic SSE response: {e}")
            traceback.print_exc()
            return f"Error during prettifying: {e}\n\n" + data.decode(
                "utf-8", errors="replace"
            )

    def prettify_exec(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        if not isinstance(metadata.http_message, Response):
            return f'"{self.name}" is for Anthropic SSE Response'

        events = parse_sse_data(data)
        if not events:
            return "# Empty SSE Response or [DONE] only"

        # 从事件流中查找消息元数据
        message_metadata = None
        for event in events:
            if event.get("type") == "message_start":
                message_metadata = event.get("message", {})
                break
        
        if not message_metadata:
            # 如果没有找到 message_start，尝试从其他事件中获取
            for event in events:
                if "message" in event:
                    message_metadata = event["message"]
                    break
        
        if not message_metadata:
            message_metadata = {}

        result = f"# Anthropic SSE Response ({len(events)} events)\n \n"

        # 1. 处理基础信息
        result += handle_response_basis(message_metadata)
        result += multi_line_splitter(2)

        # 2. 处理所有聚合后的内容
        result += handle_sse_content(events)
        result += multi_line_splitter(2)

        # 3. 处理停止原因
        result += handle_stop_reason(events)

        return result

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        content_type = metadata.content_type or ""
        is_sse = "text/event-stream" in content_type

        # 匹配 Anthropic streaming API 路径
        is_anthropic_stream_path = "/messages" in metadata.flow.request.path

        if (
            isinstance(metadata.http_message, Response)
            and is_anthropic_stream_path
            and is_sse
        ):
            # 检查是否有 'data:' 标志和 Anthropic 主机名，进一步确认是SSE
            if b"data:" in data[:100] and "anthropic" in metadata.flow.request.host.lower():
                return 2
        return 0


contentviews.add(AnthropicRespSSE)
