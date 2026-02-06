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
          <TextBlock v-if="item.type === 'text' && item.text" :id="item.id" :text="item.text" is-prose />
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
:root {
  --border-system: #f59e0b;
  --border-user: #3b82f6;
  --border-assistant: #10b981;
  --border-tool: #8b5cf6;
  --bg-hover: #f8fafc;
  --bg-content: rgba(136, 188, 197, 0.08);
  --bg-tool: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --font-mono: 'Monaco', 'Menlo', monospace;
}

.message {
  border-bottom: 2px solid rgba(126, 180, 233, 0.31);
  padding: 4px 8px;
}

.message:last-child {
  border-bottom: none;
}

.role-system {
  border-left: 3px solid var(--border-system);
}

.role-user {
  border-left: 3px solid var(--border-user);
}

.role-assistant {
  border-left: 3px solid var(--border-assistant);
}

.role-tool {
  border-left: 3px solid var(--border-tool);
}

.header {
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header:hover {
  background: var(--bg-hover);
  margin: 0 -12px;
  padding: 6px 12px;
  border-radius: 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle {
  color: var(--text-secondary);
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.index {
  font-size: 1.2rem;
  color: var(--text-muted);
  font-weight: 500;
}

.msg-id,
.tool-id {
  font-size: 1.1rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.tool-name {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 700;
  background: #f3e8ff;
  color: #7c3aed;
  font-family: var(--font-mono);
}

.content {
  padding: 0px 16px;
  background: var(--bg-content);
  overflow-y: auto;
}

.empty {
  color: var(--text-muted);
  font-style: italic;
  padding: 8px 0;
}

.tool-requests {
  margin-top: 0;
}

.tool-request {
  background: var(--bg-tool);
  border-radius: 6px;
  padding: 2px;
  margin-bottom: 4px;
}

.tool-request-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 1.4rem;
  color: var(--text-primary);
}

.badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #dbeafe;
  color: #1d4ed8;
}

.tool-idx {
  color: var(--text-secondary);
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
  transition: all 0.2s;
}

.clickable:hover {
  color: #1d4ed8;
  border-bottom-color: #1d4ed8;
}

.tool-args {
  font-family: var(--font-mono);
  border-radius: 4px;
  font-size: 1.28rem;
  overflow-x: auto;
  margin: 0;
}
</style>