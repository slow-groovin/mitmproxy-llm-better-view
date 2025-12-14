import logging
import json
from typing import Any, List, Dict, Tuple
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
    """处理响应的基础信息: model, object, usage"""
    basic_result = ""
    model = body.get("model", "N/A")
    object_type = body.get("object", "N/A")

    # 获取token使用情况
    id = body.get("id", "N/A")
    usage = body.get("usage", {})
    prompt_tokens = usage and usage.get("prompt_tokens", "N/A")
    completion_tokens = usage and usage.get("completion_tokens", "N/A")
    total_tokens = usage and usage.get("total_tokens", "N/A")

    # 计算所有标签的最大长度，实现右对齐
    labels = [
        "id",
        "model",
        "object",
        "prompt_tokens",
        "completion_tokens",
        "total_tokens",
    ]
    max_label_len = max(len(label) for label in labels) + 2

    basic_result += f'{"id":<{max_label_len}}:   {id}\n'
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"object":<{max_label_len}}:   {object_type}\n'
    basic_result += f'{"prompt_tokens":<{max_label_len}}:   {prompt_tokens}\n'
    basic_result += f'{"completion_tokens":<{max_label_len}}:   {completion_tokens}\n'
    basic_result += f'{"total_tokens":<{max_label_len}}:   {total_tokens}\n'

    return basic_result


def handle_system_fingerprint(body: Any) -> str:
    """处理系统指纹信息"""
    system_fingerprint = body.get("system_fingerprint", None)
    if system_fingerprint:
        return f"## System Fingerprint🔑\n{system_fingerprint}\n"
    return ""


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


def handle_sse_choices(events: List[Dict[str, Any]]) -> str:
    """
    处理和聚合SSE事件流中的所有choices，包括文本内容和工具调用。

    Args:
        events: 解析后的SSE事件列表。

    Returns:
        格式化后的字符串，展示所有聚合后的choice内容。
    """
    # aggregated_choices 的结构:
    # {
    #   choice_index: {
    #     "content": "...",
    #     "reasoning": "...",
    #     "tool_calls": { tool_call_index: { ... } },
    #     "finish_reason": "...",
    #     "role": "..."
    #   }
    # }
    aggregated_choices: Dict[int, Dict[str, Any]] = {}

    for event in events:
        for choice in event.get("choices", []):
            choice_index = choice.get("index", 0)
            delta = choice.get("delta", {})

            # 确保该choice的条目存在
            if choice_index not in aggregated_choices:
                aggregated_choices[choice_index] = {
                    "content": "",
                    "reasoning": "",
                    "tool_calls": {},
                    "finish_reason": "N/A",
                    "role": "N/A",
                }

            current_choice = aggregated_choices[choice_index]

            # 聚合角色
            if delta.get("role"):
                current_choice["role"] = delta.get("role")

            # 聚合内容 (stop)
            if delta.get("content"):
                current_choice["content"] += delta.get("content")

            # 聚合推理内容 (reasoning or reasoning_content)
            reasoning = delta.get("reasoning") or delta.get("reasoning_content")
            if reasoning:
                current_choice["reasoning"] += reasoning

            # 聚合工具调用 (tool_calls)
            if delta.get("tool_calls"):
                for tool_call_chunk in delta.get("tool_calls", []):
                    tool_index = tool_call_chunk.get("index")
                    if tool_index is None:
                        continue  # 无效的tool_call块

                    # 确保该tool_call的条目存在
                    if tool_index not in current_choice["tool_calls"]:
                        current_choice["tool_calls"][tool_index] = {}

                    current_tool_call = current_choice["tool_calls"][tool_index]

                    # 合并ID, type, function name
                    if "id" in tool_call_chunk:
                        current_tool_call["id"] = tool_call_chunk["id"]
                    if "type" in tool_call_chunk:
                        current_tool_call["type"] = tool_call_chunk["type"]
                    if "function" in tool_call_chunk:
                        func = tool_call_chunk["function"]
                        if "name" in func:
                            if "function" not in current_tool_call:
                                current_tool_call["function"] = {}
                            current_tool_call["function"]["name"] = func["name"]
                        # 拼接 arguments
                        if "arguments" in func:
                            if "function" not in current_tool_call:
                                current_tool_call["function"] = {}
                            if "arguments" not in current_tool_call["function"]:
                                current_tool_call["function"]["arguments"] = ""
                            current_tool_call["function"]["arguments"] += (
                                func["arguments"] or ""
                            )

            # 获取最终的 finish_reason
            if choice.get("finish_reason"):
                current_choice["finish_reason"] = choice.get("finish_reason")

    # 格式化输出
    choices_result = "## Choices🔍\n"
    for index, choice_data in sorted(aggregated_choices.items()):
        finish_reason = choice_data.get("finish_reason", "N/A")
        role = choice_data.get("role", "N/A")

        choices_result += f"### 📋Choice {index}   [finish_reason: `{finish_reason}`, role:`{role}`]\n"

        # 显示聚合的推理内容
        reasoning = choice_data.get("reasoning", "").strip()
        if reasoning:
            choices_result += f"#### 🧠 Reasoning\n"
            choices_result += f"{split_line}{indent_text(reasoning, 4)}{split_line}"

        # 显示聚合的文本内容
        
        content = choice_data.get("content", "").strip()
        if content:
            choices_result += f"#### ✏️ Content\n"
            choices_result += f"{split_line}{indent_text(content, 4)}{split_line}"

        # 显示聚合的工具调用
        tool_calls = choice_data.get("tool_calls", {})
        if tool_calls:
            choices_result += f"#### Tool Calls ({len(tool_calls)})\n"
            for j, tool_call_data in sorted(tool_calls.items()):
                tool_id = tool_call_data.get("id", "N/A")
                tool_type = tool_call_data.get("type", "N/A")
                function = tool_call_data.get("function", {})
                function_name = function.get("name", "N/A")
                arguments = function.get("arguments", "{}")

                choices_result += f"##### 🔨Tool Call {j}\n"
                choices_result += f"  - ID      : {tool_id}\n"
                choices_result += f"  - Type    : {tool_type}\n"
                choices_result += f"  - Function: {function_name}\n"
                choices_result += f"  - Arguments: {split_line}{indent_text(arguments, 4)}{split_line}"

    return choices_result


class OpenaiRespSSE(Contentview):
    name = "OpenAI SSE Response"
    syntax_highlight = "none"

    def prettify(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error prettifying SSE response: {e}")
            traceback.print_exc()
            return f"Error during prettifying: {e}\n\n" + data.decode(
                "utf-8", errors="replace"
            )

    def prettify_exec(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        # logging.info('prettify LLM SSE Response body')
        if not isinstance(metadata.http_message, Response):
            return f'"{self.name}" is for LLM SSE Response'

        events = parse_sse_data(data)
        if not events:
            return "# Empty SSE Response or [DONE] only"

        # 从后往前查找最后一个包含 usage 信息的事件，作为基础信息来源
        # 这比简单取 a[-1] 更可靠，因为最后几个事件可能是空的
        final_event_for_meta = None
        for event in reversed(events):
            if "usage" in event and event["usage"] is not None:
                final_event_for_meta = event
                break
        # 如果没找到带 usage 的，就用最后一个事件作为兜底
        if not final_event_for_meta:
            final_event_for_meta = events[-1]

        result = f"# LLM SSE Response ({len(events)} events) \n \n"

        # 1. 处理基础信息
        result += handle_response_basis(final_event_for_meta)
        result += multi_line_splitter(2)

        # 2. 处理所有聚合后的 Choices (包括 stop 和 tool_calls)
        result += handle_sse_choices(events)
        result += multi_line_splitter(2)

        # 3. 处理系统指纹
        result += handle_system_fingerprint(final_event_for_meta)

        return result

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        content_type = metadata.content_type or ""
        is_sse = "text/event-stream" in content_type

        # 更精确地匹配 OpenAI streaming API 路径
        is_openai_stream_path = metadata.flow.request.path.endswith(
            "/chat/completions"
        ) or metadata.flow.request.path.endswith("/completions")

        if (
            isinstance(metadata.http_message, Response)
            and is_openai_stream_path
            and is_sse
        ):
            # 检查是否有 'data:' 标志，进一步确认是SSE
            if b"data:" in data[:100]:
                return 2
        return 0


contentviews.add(OpenaiRespSSE)
