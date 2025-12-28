import logging
import json
from typing import Any, List

from mitmproxy.contentviews._api import Contentview
from mitmproxy import contentviews
from mitmproxy.http import Request

from llm_utils import multi_line_splitter, indent_text, SPLIT_LINE

split_line = SPLIT_LINE


def handle_request_basis(body: Any) -> str:
    """处理请求的基础信息: model, input.length, response_format"""
    basic_result = ""
    model = body.get("model", "N/A")
    input_messages = body.get("input", [])
    input_length = len(input_messages) if isinstance(input_messages, list) else 1
    
    # 获取响应格式信息
    response_format = body.get("response_format", {})
    if isinstance(response_format, dict):
        format_type = response_format.get("type", "N/A")
    else:
        format_type = str(response_format)
    
    # 计算所有标签的最大长度，实现右对齐
    labels = ["model", "input_messages", "response_format"]
    max_label_len = max(len(label) for label in labels) + 2
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"input_messages":<{max_label_len}}:   {input_length}\n'
    basic_result += f'{"response_format":<{max_label_len}}:   {format_type}\n'
    return basic_result


def handle_input(input_data: Any) -> str:
    """处理输入数据"""
    input_result = "## Input📖\n"
    
    if isinstance(input_data, list):
        # 输入是消息列表
        for i, message in enumerate(input_data):
            if isinstance(message, dict):
                role = message.get("role", "N/A")
                content = message.get("content", "")
                input_result += f"### 📋{i}    [role: {role}]\n"
                input_result += f"{split_line}{indent_text(str(content), 4)}{split_line}"
            else:
                input_result += f"### 📋{i}\n"
                input_result += f"{split_line}{indent_text(str(message), 4)}{split_line}"
    else:
        # 输入是单个字符串或其他类型
        input_result += f"{split_line}{indent_text(str(input_data), 4)}{split_line}"
    
    return input_result


def handle_response_format(response_format: Any) -> str:
    """处理响应格式定义"""
    if not response_format or not isinstance(response_format, dict):
        return ""
    
    format_result = "## Response Format Schema📋\n"
    
    # 提取 schema 信息
    schema = response_format.get("json_schema", {})
    if schema:
        schema_name = schema.get("name", "N/A")
        schema_strict = schema.get("strict", False)
        schema_def = schema.get("schema", {})
        
        format_result += f"Name: {schema_name}\n"
        format_result += f"Strict: {schema_strict}\n"
        format_result += f"Schema:\n"
        format_result += f"{split_line}{indent_text(json.dumps(schema_def, indent=2), 4)}{split_line}"
    else:
        # 如果没有 json_schema，显示整个 response_format
        format_result += f"{split_line}{indent_text(json.dumps(response_format, indent=2), 4)}{split_line}"
    
    return format_result


class OpenaiResponsesReq(Contentview):
    name = "OpenAI Responses Request"
    syntax_highlight = "none"

    def prettify(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error in OpenaiResponsesReq prettify: {e}")
            return f"Error processing request: {e}"

    def prettify_exec(
        self,
        data: bytes,
        metadata: contentviews.Metadata,
    ) -> str:
        obj = json.loads(data)

        result = "# OpenAI Responses API Request body\n \n"
        result += handle_request_basis(obj)
        result += multi_line_splitter(2)
        
        # 处理输入
        input_data = obj.get("input")
        if input_data:
            result += handle_input(input_data)
            result += multi_line_splitter(2)
        
        # 处理响应格式定义
        response_format = obj.get("response_format")
        if response_format:
            result += handle_response_format(response_format)

        return result

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if (
            metadata.content_type
            and metadata.content_type.startswith("application/")
            and metadata.content_type.endswith("json")
            and isinstance(metadata.http_message, Request)
        ):
            # Check if this is an OpenAI Responses API request
            # The path should contain /responses or similar
            path = metadata.flow.request.path
            if "/responses" in path or "/v1/responses" in path:
                return 2
        return 0


contentviews.add(OpenaiResponsesReq)
