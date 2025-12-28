import logging
import json
from typing import Any

from mitmproxy.contentviews._api import Contentview
from mitmproxy import contentviews
from mitmproxy.http import Response


def multi_line_splitter(line: int) -> str:
    return "\n " * line + "\n"


def indent_text(text: str, n: int) -> str:
    """将多行文本整体缩进 n 个空格"""
    if not text:
        return text
    indent = " " * n
    # 尝试美化JSON
    try:
        if isinstance(text, dict):
            text = json.dumps(text, indent=4, ensure_ascii=False)
        elif isinstance(text, str):
            parsed = json.loads(text)
            text = json.dumps(parsed, indent=4, ensure_ascii=False)
    except (json.JSONDecodeError, TypeError):
        pass
    
    if isinstance(text, dict):
        text = json.dumps(text, indent=4, ensure_ascii=False)
    
    indented_lines = [
        (indent + line) if line.strip() else line for line in str(text).splitlines()
    ]
    return "\n".join(indented_lines)


split_line = "\n----------------------------------\n"


def handle_response_basis(body: Any) -> str:
    """处理响应的基础信息: id, object, model, created, usage"""
    basic_result = ""
    id = body.get("id", "N/A")
    object_type = body.get("object", "N/A")
    model = body.get("model", "N/A")
    created = body.get("created", "N/A")

    # 获取token使用情况
    usage = body.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", "N/A")
    completion_tokens = usage.get("completion_tokens", "N/A")
    total_tokens = usage.get("total_tokens", "N/A")

    # 计算所有标签的最大长度，实现右对齐
    labels = [
        "id",
        "object",
        "model",
        "created",
        "prompt_tokens",
        "completion_tokens",
        "total_tokens",
    ]
    max_label_len = max(len(label) for label in labels) + 2

    basic_result += f'{"id":<{max_label_len}}:   {id}\n'
    basic_result += f'{"object":<{max_label_len}}:   {object_type}\n'
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"created":<{max_label_len}}:   {created}\n'
    basic_result += f'{"prompt_tokens":<{max_label_len}}:   {prompt_tokens}\n'
    basic_result += f'{"completion_tokens":<{max_label_len}}:   {completion_tokens}\n'
    basic_result += f'{"total_tokens":<{max_label_len}}:   {total_tokens}\n'

    return basic_result


def handle_output(output: Any) -> str:
    """处理输出内容"""
    output_result = "## Output✨\n"
    
    if isinstance(output, dict):
        # 结构化输出
        output_result += f"{split_line}{indent_text(output, 4)}{split_line}"
    elif isinstance(output, str):
        # 文本输出
        output_result += f"{split_line}{indent_text(output, 4)}{split_line}"
    elif isinstance(output, list):
        # 列表输出
        for i, item in enumerate(output):
            output_result += f"### Item {i}\n"
            output_result += f"{split_line}{indent_text(item, 4)}{split_line}"
    else:
        output_result += f"{split_line}{indent_text(str(output), 4)}{split_line}"
    
    return output_result


def handle_system_fingerprint(body: Any) -> str:
    """处理系统指纹信息"""
    system_fingerprint = body.get("system_fingerprint", None)
    if system_fingerprint:
        return f"## System Fingerprint🔑\n{system_fingerprint}\n"
    return ""


class OpenaiResponsesResp(Contentview):
    name = "OpenAI Responses Response"
    syntax_highlight = "none"

    def prettify(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error in OpenaiResponsesResp prettify: {e}")
            return f"Error processing response: {e}"

    def prettify_exec(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        logging.info("prettify OpenAI Responses API Response body")
        obj = json.loads(data)

        result = f"# OpenAI Responses API Response body\n \n"
        result += handle_response_basis(obj)
        result += multi_line_splitter(2)

        # 处理输出内容
        output = obj.get("output")
        if output is not None:
            result += handle_output(output)
            result += multi_line_splitter(2)

        # 处理系统指纹
        result += handle_system_fingerprint(obj)

        return result

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if (
            metadata.content_type
            and metadata.content_type.startswith("application/")
            and metadata.content_type.endswith("json")
            and isinstance(metadata.http_message, Response)
        ):
            # Check if this is an OpenAI Responses API response
            path = metadata.flow.request.path
            if "/responses" in path or "/v1/responses" in path:
                return 2
        return 0


contentviews.add(OpenaiResponsesResp)
