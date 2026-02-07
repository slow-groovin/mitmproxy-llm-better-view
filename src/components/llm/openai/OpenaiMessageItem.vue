<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import RoleBadge from '../messages/RoleBadge.vue';
import TextBlock from '../messages/blocks/TextBlock.vue';
import ImageBlock from '../messages/blocks/ImageBlock.vue';
import type {
  OpenaiChatMessage,
  MessageContent,
  AssistantMessage,
  ToolMessage,
  TextContentItem,
  ImageContentItem,
} from '@/types/openai/chat-request';
import OpenaiAssistantToolCalls from './OpenaiAssistantToolCalls.vue';
import { hashId } from '@/utils/id/hashId';

interface Props {
  id?: string;
  role: string;
  index: number;
  message: OpenaiChatMessage;
}

const props = defineProps<Props>();

const storageKey = computed(() => `openai-msg-${props.id || hashId(JSON.stringify(props.message))}-open`);
const isOpen = useSessionStorage(storageKey, true);

// 内容项解析
const contentItems = computed(() => {
  const content = props.message.content as MessageContent;
  if (!content) return [];

  if (typeof content === 'string') {
    return [{ type: 'text', text: content, id: 'content-0', url: undefined }];
  }

  if (Array.isArray(content)) {
    return content.map((item, idx) => ({
      type: item.type,
      text: item.type === 'text' ? (item as TextContentItem).text : undefined,
      url: item.type === 'image_url' ? (item as ImageContentItem).image_url.url : undefined,
      id: `content-${idx}`,
    }));
  }

  return [];
});

// 工具调用请求 (来自assistant)
const toolRequests = computed(() => {
  if (props.message.role !== 'assistant') return [];
  return (props.message as AssistantMessage).tool_calls || [];
});

// 工具调用响应 (来自tool)
const toolResponse = computed(() => {
  if (props.message.role !== 'tool') return null;
  const msg = props.message as ToolMessage;
  return { id: msg.tool_call_id, name: msg.name };
});

const hasContent = computed(() => contentItems.value.length > 0);

function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
}
</script>

<template>
  <div class="message" :class="`role-${role.toLowerCase()}`">
    <div class="header" @click="isOpen = !isOpen" :title="id">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index + 1 }}</span>
        <RoleBadge :role="role" />
        <span v-if="toolResponse?.name" class="tool-name">{{ toolResponse.name }}</span>
      </div>

      <span v-if="id" class="msg-id">{{ id.slice(0, 8) }}</span>
      <span v-if="toolResponse?.id" :id="`tool-response-${toolResponse.id}`" class="tool-id clickable"
        @click.stop="scrollTo(`#tool-request-${toolResponse.id}`)">
        {{ toolResponse.id }}
      </span>
    </div>

    <div v-show="isOpen" class="content">
      <!-- 内容块 -->
      <template v-if="hasContent">
        <template v-for="item in contentItems" :key="item.id">
          <TextBlock v-if="item.type === 'text' && item.text" :id="item.id" :text="item.text" />
          <ImageBlock v-else-if="item.type === 'image'" :id="item.id" :url="item.url!" />
        </template>
      </template>
      <div v-else class="empty" hidden></div>

      <!-- 工具调用 -->
      <OpenaiAssistantToolCalls v-if="toolRequests.length" :tool-calls="toolRequests" />

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

.role-system { border-left: 3px solid var(--llm-border-system); }
.role-user { border-left: 3px solid var(--llm-border-user); }
.role-assistant { border-left: 3px solid var(--llm-border-assistant); }
.role-tool { border-left: 3px solid var(--llm-border-tool); }

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

.msg-id,
.tool-id {
  font-size: 1.1rem;
  color: var(--llm-text-muted);
  font-family: var(--llm-font-mono);
}

.tool-name {
  padding: 3px 8px;
  border-radius: var(--llm-radius-md);
  font-size: 1.2rem;
  font-weight: 700;
  background: var(--llm-tool-name-bg);
  color: var(--llm-tool-name-text);
  font-family: var(--llm-font-mono);
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

.tool-requests {
  margin-top: 0;
}

.tool-request {
  background: var(--llm-bg-tool);
  border-radius: var(--llm-radius-lg);
  padding: var(--llm-spacing-xs);
  margin-bottom: var(--llm-spacing-xs);
}

.tool-request-header {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md);
  margin-bottom: var(--llm-spacing-md);
  font-weight: 600;
  font-size: 1.4rem;
  color: var(--llm-text-primary);
}

.badge {
  padding: 2px 6px;
  border-radius: var(--llm-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--llm-tool-badge-bg);
  color: var(--llm-tool-badge-text);
}

.tool-idx {
  color: var(--llm-text-secondary);
  font-size: 1.2rem;
}

.tool-id {
  margin-left: auto;
}

.clickable {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  border-bottom: 1px dotted transparent;
  transition: all var(--llm-transition-fast);
}

.clickable:hover {
  color: var(--llm-text-link);
  border-bottom-color: var(--llm-text-link);
}

.tool-args {
  font-family: var(--llm-font-mono);
  border-radius: var(--llm-radius-md);
  font-size: 1.28rem;
  overflow-x: auto;
  margin: 0;
}
</style>