"""
Unified LLM API Content Viewer for mitmproxy

This addon provides better viewing of LLM API requests and responses for:
- OpenAI Chat Completions API (streaming and non-streaming)
- OpenAI Responses API (streaming and non-streaming)  
- Anthropic Messages API (streaming and non-streaming)

All functionality is consolidated into a single file for easier management.
"""

import logging
import json
import traceback
from typing import Any, List, Dict

from mitmproxy.contentviews._api import Contentview
from mitmproxy import contentviews
from mitmproxy.http import Request, Response


# ============================================================================
# Utility Functions
# ============================================================================

def multi_line_splitter(line: int) -> str:
    """生成line个空行作为分隔符"""
    return "\n " * line + "\n"


def indent_text(text: str, n: int) -> str:
    """
    将多行文本整体缩进 n 个空格
    
    Args:
        text: 要缩进的文本
        n: 缩进的空格数
        
    Returns:
        缩进后的文本
    """
    if not text:
        return text
    indent = " " * n
    indented_lines = [
        (indent + line) if line.strip() else line for line in text.splitlines()
    ]
    return "\n".join(indented_lines)


def indent_text_with_json(text: str, n: int) -> str:
    """
    将文本缩进，如果是JSON则先美化
    
    Args:
        text: 要缩进的文本（可能是JSON字符串或字典）
        n: 缩进的空格数
        
    Returns:
        缩进并美化后的文本
    """
    if not text:
        return text
    
    indent = " " * n
    
    # 尝试美化JSON
    if isinstance(text, dict):
        text = json.dumps(text, indent=4, ensure_ascii=False)
    elif isinstance(text, str):
        try:
            parsed = json.loads(text)
            text = json.dumps(parsed, indent=4, ensure_ascii=False)
        except (json.JSONDecodeError, TypeError):
            pass
    
    indented_lines = [
        (indent + line) if line.strip() else line for line in str(text).splitlines()
    ]
    return "\n".join(indented_lines)


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


# 标准分隔线
SPLIT_LINE = "\n----------------------------------\n"


# ============================================================================
# OpenAI Chat Completions - Request Handler
# ============================================================================

def handle_openai_request_basis(body: Any) -> str:
    """处理OpenAI请求的基础信息"""
    basic_result = ""
    model = body.get("model", "N/A")
    temperature = body.get("temperature", "N/A")
    stream = body.get("stream", "N/A")
    messages_length = len(body.get("messages", []))
    tools_length = len(body.get("tools", []))
    
    labels = ["model", "temperature", "stream", "messages", "tools"]
    max_label_len = max(len(label) for label in labels) + 2
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"temperature":<{max_label_len}}:   {temperature}\n'
    basic_result += f'{"stream":<{max_label_len}}:   {stream}\n'
    basic_result += f'{"messages":<{max_label_len}}:   {messages_length}\n'
    basic_result += f'{"tools":<{max_label_len}}:   {tools_length}\n'
    return basic_result


def handle_openai_messages(messages: List[Any]) -> str:
    """处理OpenAI消息列表"""
    prompt_result = "## Messages📖\n"
    for i, message in enumerate(messages):
        role = message.get("role")
        content = message.get("content")
        prompt_result += f"### 📋{i}    [role: {role}]\n"
        prompt_result += f"{SPLIT_LINE}{indent_text(str(content), 4)}{SPLIT_LINE}"
    return prompt_result


def handle_openai_tools(tools: List[Any]) -> str:
    """处理OpenAI工具定义"""
    if not tools:
        return ""
    tool_result = "## Tools🛠️\n"
    for i, tool in enumerate(tools):
        tool_name = tool["function"]["name"]
        tool_desc = tool["function"]["description"]
        tool_result += f"### 🛠️ {tool_name}\n{SPLIT_LINE}{indent_text(tool_desc, 4)}{SPLIT_LINE}"
    return tool_result


# ============================================================================
# OpenAI Chat Completions - Response Handler
# ============================================================================

def handle_openai_response_basis(body: Any) -> str:
    """处理OpenAI响应的基础信息"""
    basic_result = ""
    model = body.get("model", "N/A")
    object_type = body.get("object", "N/A")
    id = body.get("id", "N/A")
    usage = body.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", "N/A")
    completion_tokens = usage.get("completion_tokens", "N/A")
    total_tokens = usage.get("total_tokens", "N/A")
    
    labels = ["id", "model", "object", "prompt_tokens", "completion_tokens", "total_tokens"]
    max_label_len = max(len(label) for label in labels) + 2
    
    basic_result += f'{"id":<{max_label_len}}:   {id}\n'
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"object":<{max_label_len}}:   {object_type}\n'
    basic_result += f'{"prompt_tokens":<{max_label_len}}:   {prompt_tokens}\n'
    basic_result += f'{"completion_tokens":<{max_label_len}}:   {completion_tokens}\n'
    basic_result += f'{"total_tokens":<{max_label_len}}:   {total_tokens}\n'
    
    return basic_result


def handle_openai_response_choices(choices: List[Any]) -> str:
    """处理OpenAI响应选项"""
    choices_result = "## Choices🔍\n"
    
    for i, choice in enumerate(choices):
        index = choice.get("index", i)
        finish_reason = choice.get("finish_reason", "N/A")
        
        message = choice.get("message", {})
        role = message.get("role", "N/A")
        content = message.get("content", "N/A")
        
        choices_result += f"### 📋Choice {index}   [finish_reason: `{finish_reason}`, role:`{role}`]\n"
        
        # 处理推理内容（reasoning content）
        reasoning = message.get("reasoning") or message.get("reasoning_content")
        if reasoning:
            choices_result += f"#### 🧠 Reasoning\n"
            choices_result += f"{SPLIT_LINE}{indent_text(reasoning, 4)}{SPLIT_LINE}"
        
        choices_result += f"#### ✏️ Content\n"
        choices_result += f"{SPLIT_LINE}{indent_text(str(content), 4)}{SPLIT_LINE}"
        
        # 处理工具调用
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
                choices_result += f"Arguments: {SPLIT_LINE}{indent_text(arguments, 4)}{SPLIT_LINE}"
    
    return choices_result


def handle_openai_sse_choices(events: List[Dict[str, Any]]) -> str:
    """处理和聚合OpenAI SSE事件流中的所有choices"""
    aggregated_choices: Dict[int, Dict[str, Any]] = {}
    
    for event in events:
        for choice in event.get("choices", []):
            choice_index = choice.get("index", 0)
            delta = choice.get("delta", {})
            
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
            
            # 聚合内容
            if delta.get("content"):
                current_choice["content"] += delta.get("content")
            
            # 聚合推理内容
            reasoning = delta.get("reasoning") or delta.get("reasoning_content")
            if reasoning:
                current_choice["reasoning"] += reasoning
            
            # 聚合工具调用
            if delta.get("tool_calls"):
                for tool_call_chunk in delta.get("tool_calls", []):
                    tool_index = tool_call_chunk.get("index")
                    if tool_index is None:
                        continue
                    
                    if tool_index not in current_choice["tool_calls"]:
                        current_choice["tool_calls"][tool_index] = {}
                    
                    current_tool_call = current_choice["tool_calls"][tool_index]
                    
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
                        if "arguments" in func:
                            if "function" not in current_tool_call:
                                current_tool_call["function"] = {}
                            if "arguments" not in current_tool_call["function"]:
                                current_tool_call["function"]["arguments"] = ""
                            current_tool_call["function"]["arguments"] += func["arguments"] or ""
            
            # 获取最终的 finish_reason
            if choice.get("finish_reason"):
                current_choice["finish_reason"] = choice.get("finish_reason")
    
    # 格式化输出
    choices_result = "## Choices🔍\n"
    for index, choice_data in sorted(aggregated_choices.items()):
        finish_reason = choice_data.get("finish_reason", "N/A")
        role = choice_data.get("role", "N/A")
        
        choices_result += f"### 📋Choice {index}   [finish_reason: `{finish_reason}`, role:`{role}`]\n"
        
        reasoning = choice_data.get("reasoning", "").strip()
        if reasoning:
            choices_result += f"#### 🧠 Reasoning\n"
            choices_result += f"{SPLIT_LINE}{indent_text(reasoning, 4)}{SPLIT_LINE}"
        
        content = choice_data.get("content", "").strip()
        if content:
            choices_result += f"#### ✏️ Content\n"
            choices_result += f"{SPLIT_LINE}{indent_text(content, 4)}{SPLIT_LINE}"
        
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
                choices_result += f"  - Arguments: {SPLIT_LINE}{indent_text_with_json(arguments, 4)}{SPLIT_LINE}"
    
    return choices_result


def handle_system_fingerprint(body: Any) -> str:
    """处理系统指纹信息"""
    system_fingerprint = body.get("system_fingerprint", None)
    if system_fingerprint:
        return f"## System Fingerprint🔑\n{system_fingerprint}\n"
    return ""


# ============================================================================
# Anthropic Messages API - Request Handler
# ============================================================================

def handle_anthropic_request_basis(body: Any) -> str:
    """处理Anthropic请求的基础信息"""
    basic_result = ""
    model = body.get("model", "N/A")
    max_tokens = body.get("max_tokens", "N/A")
    temperature = body.get("temperature", "N/A")
    stream = body.get("stream", "N/A")
    messages_length = len(body.get("messages", []))
    
    labels = ["model", "max_tokens", "temperature", "stream", "messages"]
    max_label_len = max(len(label) for label in labels) + 2
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"max_tokens":<{max_label_len}}:   {max_tokens}\n'
    basic_result += f'{"temperature":<{max_label_len}}:   {temperature}\n'
    basic_result += f'{"stream":<{max_label_len}}:   {stream}\n'
    basic_result += f'{"messages":<{max_label_len}}:   {messages_length}\n'
    return basic_result


def handle_anthropic_system_prompt(system: Any) -> str:
    """处理Anthropic系统提示词"""
    if not system:
        return ""
    
    # Handle system as a list of content blocks (with cache_control, type, text)
    if isinstance(system, list):
        system_text = ""
        for item in system:
            if isinstance(item, dict):
                if item.get("type") == "text":
                    system_text += item.get("text", "")
            else:
                system_text += str(item)
        system = system_text
    
    if system:
        return f"## System Prompt📌\n{SPLIT_LINE}{indent_text(str(system), 4)}{SPLIT_LINE}"
    return ""


def handle_anthropic_messages(messages: List[Any]) -> str:
    """处理Anthropic消息列表"""
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
        prompt_result += f"{SPLIT_LINE}{indent_text(str(content), 4)}{SPLIT_LINE}"
    return prompt_result


def handle_anthropic_tools(tools: List[Any]) -> str:
    """处理Anthropic工具定义"""
    if not tools:
        return ""
    
    tool_result = "## Tools🛠️\n"
    for i, tool in enumerate(tools):
        tool_name = tool.get("name", "N/A")
        tool_desc = tool.get("description", "N/A")
        input_schema = json.dumps(tool.get("input_schema", {}), indent=2)
        tool_result += f"### 🛠️ {tool_name}\n"
        tool_result += f"{SPLIT_LINE}{indent_text(tool_desc, 4)}{SPLIT_LINE}"
        tool_result += f"#### Input Schema\n"
        tool_result += f"{SPLIT_LINE}{indent_text(input_schema, 4)}{SPLIT_LINE}"
    return tool_result


# ============================================================================
# Anthropic Messages API - Response Handler
# ============================================================================

def handle_anthropic_response_basis(body: Any) -> str:
    """处理Anthropic响应的基础信息"""
    basic_result = ""
    id = body.get("id", "N/A")
    type_val = body.get("type", "N/A")
    role = body.get("role", "N/A")
    model = body.get("model", "N/A")
    
    usage = body.get("usage", {})
    input_tokens = usage.get("input_tokens", "N/A")
    output_tokens = usage.get("output_tokens", "N/A")
    
    labels = ["id", "type", "role", "model", "input_tokens", "output_tokens"]
    max_label_len = max(len(label) for label in labels) + 2
    
    basic_result += f'{"id":<{max_label_len}}:   {id}\n'
    basic_result += f'{"type":<{max_label_len}}:   {type_val}\n'
    basic_result += f'{"role":<{max_label_len}}:   {role}\n'
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"input_tokens":<{max_label_len}}:   {input_tokens}\n'
    basic_result += f'{"output_tokens":<{max_label_len}}:   {output_tokens}\n'
    
    return basic_result


def handle_anthropic_response_content(content: List[Any]) -> str:
    """处理Anthropic响应内容"""
    content_result = "## Content🔍\n"
    
    for i, item in enumerate(content):
        item_type = item.get("type", "N/A")
        
        if item_type == "text":
            text = item.get("text", "")
            content_result += f"### 📋Text Block {i}\n"
            content_result += f"{SPLIT_LINE}{indent_text(text, 4)}{SPLIT_LINE}"
        
        elif item_type == "tool_use":
            tool_id = item.get("id", "N/A")
            tool_name = item.get("name", "N/A")
            tool_input = json.dumps(item.get("input", {}), indent=2)
            
            content_result += f"### 🔨Tool Use Block {i}\n"
            content_result += f"ID: {tool_id}\n"
            content_result += f"Name: {tool_name}\n"
            content_result += f"Input:\n{SPLIT_LINE}{indent_text(tool_input, 4)}{SPLIT_LINE}"
    
    return content_result


def handle_anthropic_sse_content(events: List[Dict[str, Any]]) -> str:
    """处理和聚合Anthropic SSE事件流中的所有内容块"""
    aggregated_content: Dict[int, Dict[str, Any]] = {}
    
    for event in events:
        event_type = event.get("type")
        
        if event_type == "content_block_start":
            index = event.get("index", 0)
            content_block = event.get("content_block", {})
            block_type = content_block.get("type")
            
            if index not in aggregated_content:
                aggregated_content[index] = {"type": block_type}
            
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
                content_result += f"{SPLIT_LINE}{indent_text(text, 4)}{SPLIT_LINE}"
        
        elif block_type == "tool_use":
            tool_id = block_data.get("id", "N/A")
            tool_name = block_data.get("name", "N/A")
            tool_input = block_data.get("input", "{}")
            
            content_result += f"### 🔨Tool Use Block {index}\n"
            content_result += f"ID: {tool_id}\n"
            content_result += f"Name: {tool_name}\n"
            content_result += f"Input:\n{SPLIT_LINE}{indent_text_with_json(tool_input, 4)}{SPLIT_LINE}"
    
    return content_result


def handle_anthropic_stop_reason(body_or_events: Any) -> str:
    """处理Anthropic停止原因"""
    # 如果是字典，直接获取
    if isinstance(body_or_events, dict):
        stop_reason = body_or_events.get("stop_reason", None)
        stop_sequence = body_or_events.get("stop_sequence", None)
    # 如果是事件列表，从事件流中提取
    elif isinstance(body_or_events, list):
        stop_reason = None
        stop_sequence = None
        for event in reversed(body_or_events):
            if event.get("type") == "message_delta":
                delta = event.get("delta", {})
                stop_reason = delta.get("stop_reason")
                stop_sequence = delta.get("stop_sequence")
                if stop_reason:
                    break
    else:
        return ""
    
    if stop_reason:
        result = f"## Stop Reason🛑\n"
        result += f"Reason: {stop_reason}\n"
        if stop_sequence:
            result += f"Sequence: {stop_sequence}\n"
        return result
    return ""


# ============================================================================
# OpenAI Responses API - Request Handler
# ============================================================================

def handle_openai_responses_request_basis(body: Any) -> str:
    """处理OpenAI Responses请求的基础信息"""
    basic_result = ""
    model = body.get("model", "N/A")
    input_messages = body.get("input", [])
    input_length = len(input_messages) if isinstance(input_messages, list) else 1
    stream = body.get("stream", "N/A")
    
    response_format = body.get("response_format", {})
    if isinstance(response_format, dict):
        format_type = response_format.get("type", "N/A")
    else:
        format_type = str(response_format)
    
    labels = ["model", "input_messages", "stream", "response_format"]
    max_label_len = max(len(label) for label in labels) + 2
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"input_messages":<{max_label_len}}:   {input_length}\n'
    basic_result += f'{"stream":<{max_label_len}}:   {stream}\n'
    basic_result += f'{"response_format":<{max_label_len}}:   {format_type}\n'
    return basic_result


def handle_openai_responses_input(input_data: Any) -> str:
    """处理OpenAI Responses输入数据"""
    input_result = "## Input📖\n"
    
    if isinstance(input_data, list):
        for i, message in enumerate(input_data):
            if isinstance(message, dict):
                role = message.get("role", "N/A")
                content = message.get("content", "")
                input_result += f"### 📋{i}    [role: {role}]\n"
                input_result += f"{SPLIT_LINE}{indent_text(str(content), 4)}{SPLIT_LINE}"
            else:
                input_result += f"### 📋{i}\n"
                input_result += f"{SPLIT_LINE}{indent_text(str(message), 4)}{SPLIT_LINE}"
    else:
        input_result += f"{SPLIT_LINE}{indent_text(str(input_data), 4)}{SPLIT_LINE}"
    
    return input_result


def handle_openai_responses_format(response_format: Any) -> str:
    """处理OpenAI Responses响应格式定义"""
    if not response_format or not isinstance(response_format, dict):
        return ""
    
    format_result = "## Response Format Schema📋\n"
    
    schema = response_format.get("json_schema", {})
    if schema:
        schema_name = schema.get("name", "N/A")
        schema_strict = schema.get("strict", False)
        schema_def = schema.get("schema", {})
        
        format_result += f"Name: {schema_name}\n"
        format_result += f"Strict: {schema_strict}\n"
        format_result += f"Schema:\n"
        format_result += f"{SPLIT_LINE}{indent_text(json.dumps(schema_def, indent=2), 4)}{SPLIT_LINE}"
    else:
        format_result += f"{SPLIT_LINE}{indent_text(json.dumps(response_format, indent=2), 4)}{SPLIT_LINE}"
    
    return format_result


# ============================================================================
# OpenAI Responses API - Response Handler
# ============================================================================

def handle_openai_responses_response_basis(body: Any) -> str:
    """处理OpenAI Responses响应的基础信息"""
    basic_result = ""
    id = body.get("id", "N/A")
    object_type = body.get("object", "N/A")
    model = body.get("model", "N/A")
    created = body.get("created", "N/A")
    
    usage = body.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", "N/A")
    completion_tokens = usage.get("completion_tokens", "N/A")
    total_tokens = usage.get("total_tokens", "N/A")
    
    labels = ["id", "object", "model", "created", "prompt_tokens", "completion_tokens", "total_tokens"]
    max_label_len = max(len(label) for label in labels) + 2
    
    basic_result += f'{"id":<{max_label_len}}:   {id}\n'
    basic_result += f'{"object":<{max_label_len}}:   {object_type}\n'
    basic_result += f'{"model":<{max_label_len}}:   {model}\n'
    basic_result += f'{"created":<{max_label_len}}:   {created}\n'
    basic_result += f'{"prompt_tokens":<{max_label_len}}:   {prompt_tokens}\n'
    basic_result += f'{"completion_tokens":<{max_label_len}}:   {completion_tokens}\n'
    basic_result += f'{"total_tokens":<{max_label_len}}:   {total_tokens}\n'
    
    return basic_result


def handle_openai_responses_output(output: Any) -> str:
    """处理OpenAI Responses输出内容"""
    output_result = "## Output✨\n"
    
    if isinstance(output, dict):
        output_result += f"{SPLIT_LINE}{indent_text_with_json(output, 4)}{SPLIT_LINE}"
    elif isinstance(output, str):
        output_result += f"{SPLIT_LINE}{indent_text(output, 4)}{SPLIT_LINE}"
    elif isinstance(output, list):
        for i, item in enumerate(output):
            output_result += f"### Item {i}\n"
            output_result += f"{SPLIT_LINE}{indent_text_with_json(item, 4)}{SPLIT_LINE}"
    else:
        output_result += f"{SPLIT_LINE}{indent_text(str(output), 4)}{SPLIT_LINE}"
    
    return output_result


def handle_openai_responses_sse_output(events: List[Dict[str, Any]]) -> str:
    """处理和聚合OpenAI Responses SSE事件流中的输出"""
    # 聚合输出数据
    aggregated_output = ""
    
    for event in events:
        # 检查不同类型的输出字段
        if "output" in event:
            output = event["output"]
            if isinstance(output, str):
                aggregated_output += output
            elif isinstance(output, dict):
                # 如果是字典，可能是结构化输出的增量
                if "text" in output:
                    aggregated_output += output["text"]
                elif "delta" in output:
                    aggregated_output += output["delta"]
        
        # 检查delta字段（常见的SSE增量模式）
        if "delta" in event:
            delta = event["delta"]
            if isinstance(delta, str):
                aggregated_output += delta
            elif isinstance(delta, dict) and "output" in delta:
                output = delta["output"]
                if isinstance(output, str):
                    aggregated_output += output
    
    output_result = "## Output✨\n"
    if aggregated_output:
        output_result += f"{SPLIT_LINE}{indent_text(aggregated_output.strip(), 4)}{SPLIT_LINE}"
    else:
        output_result += "No output content in stream\n"
    
    return output_result


# ============================================================================
# Content View Classes
# ============================================================================

class LLMRequestView(Contentview):
    """Unified request viewer for all LLM APIs"""
    name = "LLM Request"
    syntax_highlight = "none"
    
    def prettify(self, data: bytes, metadata: contentviews.Metadata) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error in LLMRequestView prettify: {e}")
            return f"Error processing request: {e}"
    
    def prettify_exec(self, data: bytes, metadata: contentviews.Metadata) -> str:
        obj = json.loads(data)
        path = metadata.flow.request.path
        host = metadata.flow.request.host.lower()
        
        # Determine API type and format accordingly
        if "anthropic" in host and "/messages" in path:
            # Anthropic Messages API
            result = "# Anthropic Messages API Request\n \n"
            result += handle_anthropic_request_basis(obj)
            result += multi_line_splitter(2)
            
            system = obj.get("system", "")
            if system:
                result += handle_anthropic_system_prompt(system)
                result += multi_line_splitter(2)
            
            result += handle_anthropic_messages(obj.get("messages", []))
            result += multi_line_splitter(3)
            result += handle_anthropic_tools(obj.get("tools", []))
            
        elif "/responses" in path:
            # OpenAI Responses API
            result = "# OpenAI Responses API Request\n \n"
            result += handle_openai_responses_request_basis(obj)
            result += multi_line_splitter(2)
            
            input_data = obj.get("input")
            if input_data:
                result += handle_openai_responses_input(input_data)
                result += multi_line_splitter(2)
            
            response_format = obj.get("response_format")
            if response_format:
                result += handle_openai_responses_format(response_format)
                
        else:
            # OpenAI Chat Completions API
            result = "# OpenAI Chat Completions API Request\n \n"
            result += handle_openai_request_basis(obj)
            result += multi_line_splitter(2)
            result += handle_openai_messages(obj.get("messages", []))
            result += multi_line_splitter(3)
            result += handle_openai_tools(obj.get("tools", []))
        
        return result
    
    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if (
            metadata.content_type
            and metadata.content_type.startswith("application/")
            and metadata.content_type.endswith("json")
            and isinstance(metadata.http_message, Request)
        ):
            path = metadata.flow.request.path
            host = metadata.flow.request.host.lower()
            
            # Check for supported API paths
            if (
                path.endswith("completions") or
                "/messages" in path or
                "/responses" in path
            ):
                return 2
        return 0


class LLMResponseView(Contentview):
    """Unified non-streaming response viewer for all LLM APIs"""
    name = "LLM Response"
    syntax_highlight = "none"
    
    def prettify(self, data: bytes, metadata: contentviews.Metadata) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error in LLMResponseView prettify: {e}")
            return f"Error processing response: {e}"
    
    def prettify_exec(self, data: bytes, metadata: contentviews.Metadata) -> str:
        logging.info("prettify LLM Response body")
        obj = json.loads(data)
        path = metadata.flow.request.path
        host = metadata.flow.request.host.lower()
        
        # Determine API type and format accordingly
        if "anthropic" in host and "/messages" in path:
            # Anthropic Messages API
            result = "# Anthropic Messages API Response\n \n"
            result += handle_anthropic_response_basis(obj)
            result += multi_line_splitter(2)
            
            content = obj.get("content", [])
            if content:
                result += handle_anthropic_response_content(content)
                result += multi_line_splitter(2)
            
            result += handle_anthropic_stop_reason(obj)
            
        elif "/responses" in path:
            # OpenAI Responses API
            result = "# OpenAI Responses API Response\n \n"
            result += handle_openai_responses_response_basis(obj)
            result += multi_line_splitter(2)
            
            output = obj.get("output")
            if output is not None:
                result += handle_openai_responses_output(output)
                result += multi_line_splitter(2)
            
            result += handle_system_fingerprint(obj)
            
        else:
            # OpenAI Chat Completions API
            result = "# OpenAI Chat Completions API Response\n \n"
            result += handle_openai_response_basis(obj)
            result += multi_line_splitter(2)
            
            choices = obj.get("choices", [])
            if choices:
                result += handle_openai_response_choices(choices)
                result += multi_line_splitter(2)
            
            result += handle_system_fingerprint(obj)
        
        return result
    
    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if (
            metadata.content_type
            and metadata.content_type.startswith("application/")
            and metadata.content_type.endswith("json")
            and isinstance(metadata.http_message, Response)
        ):
            path = metadata.flow.request.path
            host = metadata.flow.request.host.lower()
            
            # Check for supported API paths
            if (
                path.endswith("completions") or
                "/messages" in path or
                "/responses" in path
            ):
                return 2
        return 0


class LLMResponseSSEView(Contentview):
    """Unified streaming (SSE) response viewer for all LLM APIs"""
    name = "LLM SSE Response"
    syntax_highlight = "none"
    
    def prettify(self, data: bytes, metadata: contentviews.Metadata) -> str:
        try:
            return self.prettify_exec(data, metadata)
        except Exception as e:
            logging.error(f"Error prettifying SSE response: {e}")
            traceback.print_exc()
            return f"Error during prettifying: {e}\n\n" + data.decode("utf-8", errors="replace")
    
    def prettify_exec(self, data: bytes, metadata: contentviews.Metadata) -> str:
        if not isinstance(metadata.http_message, Response):
            return f'"{self.name}" is for LLM SSE Response'
        
        events = parse_sse_data(data)
        if not events:
            return "# Empty SSE Response or [DONE] only"
        
        path = metadata.flow.request.path
        host = metadata.flow.request.host.lower()
        
        # Determine API type and format accordingly
        if "anthropic" in host and "/messages" in path:
            # Anthropic Messages API SSE
            message_metadata = None
            for event in events:
                if event.get("type") == "message_start":
                    message_metadata = event.get("message", {})
                    break
            
            if not message_metadata:
                for event in events:
                    if "message" in event:
                        message_metadata = event["message"]
                        break
            
            if not message_metadata:
                message_metadata = {}
            
            result = f"# Anthropic Messages API SSE Response ({len(events)} events)\n \n"
            result += handle_anthropic_response_basis(message_metadata)
            result += multi_line_splitter(2)
            result += handle_anthropic_sse_content(events)
            result += multi_line_splitter(2)
            result += handle_anthropic_stop_reason(events)
            
        elif "/responses" in path:
            # OpenAI Responses API SSE
            final_event_for_meta = None
            for event in reversed(events):
                if "usage" in event and event["usage"] is not None:
                    final_event_for_meta = event
                    break
            if not final_event_for_meta:
                final_event_for_meta = events[-1] if events else {}
            
            result = f"# OpenAI Responses API SSE Response ({len(events)} events)\n \n"
            result += handle_openai_responses_response_basis(final_event_for_meta)
            result += multi_line_splitter(2)
            result += handle_openai_responses_sse_output(events)
            result += multi_line_splitter(2)
            result += handle_system_fingerprint(final_event_for_meta)
            
        else:
            # OpenAI Chat Completions API SSE
            final_event_for_meta = None
            for event in reversed(events):
                if "usage" in event and event["usage"] is not None:
                    final_event_for_meta = event
                    break
            if not final_event_for_meta:
                final_event_for_meta = events[-1] if events else {}
            
            result = f"# OpenAI Chat Completions API SSE Response ({len(events)} events)\n \n"
            result += handle_openai_response_basis(final_event_for_meta)
            result += multi_line_splitter(2)
            result += handle_openai_sse_choices(events)
            result += multi_line_splitter(2)
            result += handle_system_fingerprint(final_event_for_meta)
        
        return result
    
    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        content_type = metadata.content_type or ""
        is_sse = "text/event-stream" in content_type
        
        if isinstance(metadata.http_message, Response) and is_sse:
            path = metadata.flow.request.path
            host = metadata.flow.request.host.lower()
            
            # Check for supported API paths
            is_llm_path = (
                path.endswith("/chat/completions") or
                path.endswith("/completions") or
                "/messages" in path or
                "/responses" in path
            )
            
            if is_llm_path and b"data:" in data[:100]:
                return 2
        return 0


# Register all content views
contentviews.add(LLMRequestView)
contentviews.add(LLMResponseView)
contentviews.add(LLMResponseSSEView)
