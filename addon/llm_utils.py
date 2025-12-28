"""
Shared utility functions for LLM API content views in mitmproxy.

This module contains common formatting and parsing utilities used across
all LLM API addon implementations.
"""
import json
from typing import Any


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


# 标准分隔线
SPLIT_LINE = "\n----------------------------------\n"
