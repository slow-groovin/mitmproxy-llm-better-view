import logging
import json
from typing import Any, List

from mitmproxy.contentviews._api import Contentview
from mitmproxy import contentviews
from mitmproxy.http import Response


def multi_line_splitter(line: int) -> str:
    # 生成line个'\n-'
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
    """处理响应的基础信息: model, object, usage"""
    basic_result = ""
    model = body.get("model", "N/A")
    object_type = body.get("object", "N/A")

    # 获取token使用情况
    id = body.get("id", "N/A")
    usage = body.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", "N/A")
    completion_tokens = usage.get("completion_tokens", "N/A")
    total_tokens = usage.get("total_tokens", "N/A")

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


def handle_response_choices(choices: List[Any]) -> str:
    choices_result = "## Choices🔍\n"

    for i, choice in enumerate(choices):
        index = choice.get("index", i)
        finish_reason = choice.get("finish_reason", "N/A")

        # 处理消息内容
        message = choice.get("message", {})
        role = message.get("role", "N/A")
        content = message.get("content", "N/A")

        choices_result += f"### 📋Choice {index}   [finish_reason: `{finish_reason}`, role:`{role}`]\n"
        
        # 处理推理内容（reasoning content）
        reasoning = message.get("reasoning") or message.get("reasoning_content")
        if reasoning:
            choices_result += f"#### 🧠 Reasoning\n"
            choices_result += f"{split_line}{indent_text(reasoning, 4)}{split_line}"
        
        choices_result += f"#### ✏️ Content\n"
        # 处理常规内容
        choices_result += f"{split_line}{indent_text(content, 4)}{split_line}"

        # 处理工具调用，如果有的话
        tool_calls = message.get("tool_calls", [])
        if tool_calls:
            choices_result += f"#### Tool Calls ({len(tool_calls)})\n"
            for j, tool_call in enumerate(tool_calls):
                tool_id = tool_call.get("id", "N/A")
                tool_type = tool_call.get("type", "N/A")
                function = tool_call.get("function", {})
                function_name = function.get("name", "N/A")
                arguments = function.get("arguments", "{}")

                choices_result += f"##### Tool Call {j}\n"
                choices_result += f"ID: {tool_id}\n"
                choices_result += f"Type: {tool_type}\n"
                choices_result += f"Function: {function_name}\n"
                choices_result += (
                    f"Arguments: {split_line}{indent_text(arguments, 4)}{split_line}"
                )

    return choices_result


def handle_system_fingerprint(body: Any) -> str:
    """处理系统指纹信息"""
    system_fingerprint = body.get("system_fingerprint", None)
    if system_fingerprint:
        return f"## System Fingerprint🔑\n{system_fingerprint}\n"
    return ""


class OpenaiResp(Contentview):
    name = "Openai Response"
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

        logging.info("prettify LLM Response body")
        obj = json.loads(data)

        result = f"# LLM Response body \n \n"
        result += handle_response_basis(obj)
        result += multi_line_splitter(2)

        # 处理选项/回复内容
        choices = obj.get("choices", [])
        if choices:
            result += handle_response_choices(choices)
            result += multi_line_splitter(2)

        # 处理系统指纹
        result += handle_system_fingerprint(obj)

        return result

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if (
            metadata.content_type
            and metadata.content_type.startswith("application/")
            and metadata.content_type.endswith("json")
            and metadata.flow.request.path.endswith("completions")
            and isinstance(metadata.http_message, Response)
        ):
            return 2  # return a value > 1 to make sure the custom view is automatically selected
        else:
            return 0


contentviews.add(OpenaiResp)
