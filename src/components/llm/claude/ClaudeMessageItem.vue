<script setup lang="ts">
import BetterDetails from '@/components/container/BetterDetails.vue';
import { hashId } from '@/utils/id/hashId';
import { useSessionStorage } from '@vueuse/core';
import { computed } from 'vue';
import type { ClaudeMessage, ImageBlock as ImageBlockType, TextBlock, ThinkingBlock, ToolResultBlock, ToolUseBlock } from '../../../types/claude/claude-request';
import ImageBlock from '@/components/content/ImageBlock.vue';
import SmartViewer from '@/components/content/SmartViewer.vue';
import RoleBadge from '../RoleBadge.vue';
import ClaudeToolUseArgs from './ClaudeToolUseArgs.vue';

interface Props {
  message: ClaudeMessage;
  index: number;
}

const props = defineProps<Props>();

const storageKey = computed(() => `claude-msg-${hashId(JSON.stringify(props.message))}-open`);
const isOpen = useSessionStorage(storageKey, true);

const rawViewKey = computed(() => `claude-msg-${hashId(JSON.stringify(props.message))}-raw`);
const isRawView = useSessionStorage(rawViewKey, false);

// 解析内容块
const contentBlocks = computed(() => {
  const content = props.message.content;
  if (!content) return [];

  if (typeof content === 'string') {
    return [{ type: 'text', text: content, id: 'content-0' }];
  }

  if (Array.isArray(content)) {
    return content.map((block, idx) => {
      if (typeof block === 'string') {
        return { type: 'text', text: block, id: `content-${idx}` };
      }
      return { ...block, id: (block as any).id || `content-${idx}` };
    });
  }

  return [];
});

const contentCount = computed(() => contentBlocks.value.length);
const isUserMessage = computed(() => props.message.role === 'user');
const hasContent = computed(() => contentBlocks.value.length > 0);

// 按类型分组的内容块
const textBlocks = computed(() => 
  contentBlocks.value.filter(b => b.type === 'text') as (TextBlock & { id: string })[]
);

const imageBlocks = computed(() => 
  isUserMessage.value 
    ? contentBlocks.value.filter(b => b.type === 'image') as (ImageBlockType & { id: string })[]
    : []
);

const toolUseBlocks = computed(() => 
  props.message.role === 'assistant'
    ? contentBlocks.value.filter(b => b.type === 'tool_use') as (ToolUseBlock & { id: string })[]
    : []
);

const thinkingBlocks = computed(() => 
  props.message.role === 'assistant'
    ? contentBlocks.value.filter(b => b.type === 'thinking') as (ThinkingBlock & { id: string })[]
    : []
);

const toolResultBlocks = computed(() => {
  const blocks = contentBlocks.value.filter(b => b.type === 'tool_result') as ToolResultBlock[];
  
  return blocks.flatMap(item => {
    if (typeof item.content === 'string') {
      return [item];
    }
    if (Array.isArray(item.content)) {
      return item.content.map(subItem => ({
        ...item,
        content: subItem.text
      }));
    }
    return [];
  }) as (ToolResultBlock & { content: string })[];
});
</script>

<template>
  <div class="message" :class="`role-${message.role.toLowerCase()}`">
    <div class="header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index + 1 }}</span>
        <RoleBadge :role="message.role" />
        <span class="count-badge">{{ contentCount }}</span>
      </div>
      <div v-if="isOpen" class="header-right">
        <button
          class="raw-btn"
          :class="{ active: isRawView }"
          @click.stop="isRawView = !isRawView"
        >
          View Raw
        </button>
      </div>
    </div>

    <div v-show="isOpen" class="content">
      <template v-if="isRawView">
        <SmartViewer :text="JSON.stringify(message, null, 2)"/>
      </template>

      <template v-else>
        <template v-if="thinkingBlocks.length > 0">
          <div v-for="block in thinkingBlocks" :key="block.id">
            <BetterDetails title="thinking">
              <div class="reasoning">
                <SmartViewer :text="block.thinking" />
              </div>
            </BetterDetails>
          </div>
        </template>

        <SmartViewer 
          v-for="block in textBlocks" 
          :key="block.id" 
          :text="block.text" 
        />

        <div 
          v-for="block in imageBlocks" 
          :key="block.id" 
          class="image-block"
        >
          <ImageBlock :url="`data:${block.source.media_type};base64,${block.source.data}`" />
        </div>

        <div 
          v-for="block in toolUseBlocks" 
          :key="block.id" 
          class="tool-block"
        >
          <BetterDetails default-open>
            <template #summary>
              <div class="tool-header">
                <span class="tool-badge">TOOL USE</span>
                <span class="tool-name">{{ block.name }}</span>
                <span class="tool-id">{{ block.id }}</span>
              </div>
            </template>
            <ClaudeToolUseArgs :input="block.input" />
          </BetterDetails>
        </div>

        <div 
          v-for="block in toolResultBlocks" 
          :key="block.tool_use_id" 
          class="tool-block"
        >
          <BetterDetails default-open>
            <template #summary>
              <div class="tool-header">
                <span class="tool-badge" :class="{ 'is-error': block.is_error }">
                  TOOL RESULT
                </span>
                <span class="tool-id">{{ block.tool_use_id }}</span>
              </div>
            </template>
            <SmartViewer :text="block.content" />
          </BetterDetails>
        </div>

        <div v-if="!hasContent" class="empty">No content</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.message {
  border-bottom: 2px solid var(--llm-message-border);
  padding: var(--llm-spacing-xs) var(--llm-spacing-md);
  margin: var(--llm-spacing-sm) 0;
}

.message:last-child {
  border-bottom: none;
}

.role-user {
  /* border-left: 3px solid var(--llm-border-user); */
}

.role-assistant {
  /* border-left: 3px solid var(--llm-border-assistant); */
}

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

.raw-btn {
  padding: 4px 10px;
  font-size: 1.1rem;
  color: var(--llm-text-secondary);
  background: transparent;
  border: 1px solid var(--llm-border-color);
  border-radius: var(--llm-radius-lg);
  cursor: pointer;
  transition: all var(--llm-transition-fast);
}

.raw-btn:hover {
  color: var(--llm-text-primary);
  border-color: var(--llm-border-dark);
}

.raw-btn.active {
  color: var(--llm-btn-active-text);
  border-color: var(--llm-btn-active-border);
  background: var(--llm-btn-active-bg);
}

.count-badge {
  background-color: var(--llm-badge-assistant-bg);
  color: var(--llm-badge-assistant-text);
  font-size: 1.1rem;
  font-weight: 600;
  font-family: var(--llm-font-mono);
  padding: 2px 7px;
  border-radius: 6px;
}

.toggle {
  color: var(--llm-text-secondary);
  font-size: 1.2rem;
}

.index {
  font-size: 1.2rem;
  color: var(--llm-text-muted);
  font-weight: 500;
}

.content {
  padding: 0 var(--llm-spacing-xl);
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

.tool-block {
  margin: var(--llm-spacing-xl) 0;
  border: 1px solid #75757542;
  border-radius: var(--llm-radius-lg);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md);
  padding-bottom: var(--llm-spacing-sm);
  border-bottom: 1px solid var(--llm-border-light);
}

.tool-badge {
  padding: 2px 6px;
  border-radius: var(--llm-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--llm-badge-tool-bg);
  color: var(--llm-badge-tool-text);
}

.tool-badge.is-error {
  background: var(--llm-error-bg);
  color: var(--llm-error-text);
}

.tool-name {
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

.reasoning {
  margin-bottom: 12px;
  padding-left: 3px;
  border-left: 3px solid var(--llm-border-thinking);
  border-radius: 0 6px 6px 0;
  font-style: italic;
}
</style>