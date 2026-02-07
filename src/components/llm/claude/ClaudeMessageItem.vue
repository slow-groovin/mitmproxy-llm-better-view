<script setup lang="ts">
import { computed, useId } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import RoleBadge from '../RoleBadge.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import ImageBlock from '../../content/ImageBlock.vue';
import type { ClaudeMessage, ContentBlock, TextBlock, ImageBlock as ImageBlockType, ToolUseBlock, ToolResultBlock } from '../../../types/claude/claude-request';
import { hashId } from '@/utils/id/hashId';

interface Props {
  message: ClaudeMessage;
  index: number;
}

const props = defineProps<Props>();

const storageKey = computed(() => `claude-msg-${hashId(JSON.stringify(props.message))}-open`);
const isOpen = useSessionStorage(storageKey, true);

// 判断是否是用户消息（可能包含图片）
const isUserMessage = computed(() => props.message.role === 'user');

// 解析内容块
const contentBlocks = computed(() => {
  const content = props.message.content;
  if (!content) return [];

  // 字符串内容
  if (typeof content === 'string') {
    return [{ type: 'text', text: content, id: 'content-0' }];
  }

  // 数组内容块
  if (Array.isArray(content)) {
    return content.map((block, idx) => {
      if (typeof block === 'string') {
        return { type: 'text', text: block, id: `content-${idx}` };
      }
      return { ...block, id: `content-${idx}` };
    });
  }

  return [];
});

// 文本块
const textBlocks = computed(() => {
  const blocks = contentBlocks.value.filter(b => b.type === 'text');
  blocks.forEach((block, idx) => {
    if (typeof block.text !== 'string') {
      console.error('[ClaudeMessageItem] Invalid text block type:', {
        index: idx,
        block,
        message: props.message
      });
    }
  });
  return blocks as (TextBlock & { id: string })[];
});

// 图片块（仅用户消息可能有）
const imageBlocks = computed(() => {
  if (!isUserMessage.value) return [];
  return contentBlocks.value.filter(b => b.type === 'image') as (ImageBlockType & { id: string })[];
});

// 工具使用块（仅 assistant 消息可能有）
const toolUseBlocks = computed(() => {
  if (props.message.role !== 'assistant') return [];
  return contentBlocks.value.filter(b => b.type === 'tool_use') as (ToolUseBlock & { id: string })[];
});

// 工具结果块（仅 user 消息作为 tool_result 可能有，但通常 user 不会发送这个）
const toolResultBlocks = computed(() => {
  const blocks = contentBlocks.value.filter(b => b.type === 'tool_result') as ToolResultBlock[];
  blocks.forEach((block, idx) => {
    if (typeof block.content !== 'string') {
      console.error('[ClaudeMessageItem] Invalid tool_result content type:', {
        index: idx,
        block,
        message: props.message
      });
    }
  });
  return blocks as (ToolResultBlock & { id: string })[];
});

const hasContent = computed(() => contentBlocks.value.length > 0);

function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
}
</script>

<template>
  <div class="message" :class="`role-${message.role.toLowerCase()}`">
    <div class="header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index + 1 }}</span>
        <RoleBadge :role="message.role" />
      </div>
    </div>

    <div v-show="isOpen" class="content">
      <!-- 文本内容 -->
      <template v-if="textBlocks.length > 0">
        <SmartViewer
          v-for="block in textBlocks"
          :key="block.id"
          :text="block.text"
        />
      </template>

      <!-- 图片内容（仅用户消息） -->
      <template v-if="imageBlocks.length > 0">
        <div v-for="block in imageBlocks" :key="block.id" class="image-block">
          <ImageBlock
            :url="`data:${block.source.media_type};base64,${block.source.data}`"
          />
        </div>
      </template>

      <!-- 工具使用（仅 assistant 消息） -->
      <template v-if="toolUseBlocks.length > 0">
        <div v-for="block in toolUseBlocks" :key="block.id" class="tool-use-block">
          <div class="tool-header">
            <span class="tool-badge">TOOL USE</span>
            <span class="tool-name-display">{{ block.name }}</span>
            <span class="tool-id">{{ block.id }}</span>
          </div>
          <SmartViewer :text="JSON.stringify(block.input, null, 2)" />
        </div>
      </template>

      <!-- 工具结果 -->
      <template v-if="toolResultBlocks.length > 0">
        <div v-for="block in toolResultBlocks" :key="block.id" class="tool-result-block">
          <div class="tool-header">
            <span class="tool-badge" :class="{ 'is-error': block.is_error }">TOOL RESULT</span>
            <span class="tool-id">{{ block.tool_use_id }}</span>
          </div>
          <SmartViewer :text="block.content" />
        </div>
      </template>

      <div v-if="!hasContent" class="empty">
        No content
      </div>
    </div>
  </div>
</template>

<style scoped>
.message {
  border-bottom: 2px solid rgba(126, 180, 233, 0.31);
  padding: var(--llm-spacing-xs) var(--llm-spacing-md);
}

.message:last-child {
  border-bottom: none;
}

.role-user { border-left: 3px solid var(--llm-border-user); }
.role-assistant { border-left: 3px solid var(--llm-border-assistant); }

.header {
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header:hover {
  background: var(--llm-bg-hover);
  margin: 0 -12px;
  padding: 6px 12px;
  border-radius: var(--llm-radius-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md);
}

.toggle {
  color: var(--llm-text-secondary);
  font-size: 1.2rem;
  transition: transform var(--llm-transition-fast);
}

.index {
  font-size: 1.2rem;
  color: var(--llm-text-muted);
  font-weight: 500;
}

.content {
  padding: 0px var(--llm-spacing-xl);
  background: var(--llm-bg-content);
}

.empty {
  color: var(--llm-text-muted);
  font-style: italic;
  padding: 8px 0;
}

.image-block {
  margin: var(--llm-spacing-md) 0;
  max-width: 400px;
}

.tool-use-block,
.tool-result-block {
  margin: var(--llm-spacing-md) 0;
  background: var(--llm-bg-tool);
  border-radius: var(--llm-radius-lg);
  padding: var(--llm-spacing-md);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md);
  margin-bottom: var(--llm-spacing-md);
  padding-bottom: var(--llm-spacing-sm);
  border-bottom: 1px solid var(--llm-border-light);
}

.tool-badge {
  padding: 2px 6px;
  border-radius: var(--llm-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--llm-tool-badge-bg);
  color: var(--llm-tool-badge-text);
}

.tool-badge.is-error {
  background: var(--llm-error-bg, #fee2e2);
  color: var(--llm-error-text, #dc2626);
}

.tool-name-display {
  font-weight: 600;
  color: var(--llm-text-primary);
  font-family: var(--llm-font-mono);
}

.tool-id {
  font-size: 1.1rem;
  color: var(--llm-text-muted);
  font-family: var(--llm-font-mono);
  margin-left: auto;
}
</style>
