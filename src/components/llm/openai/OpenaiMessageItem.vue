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

interface Props {
  id?: string;
  role: string;
  index: number;
  message: OpenaiChatMessage;
}

const props = defineProps<Props>();

// Use sessionStorage to remember fold state
const storageKey = computed(() => `openai-msg-${props.id || props.index}-open`);
const isOpen = useSessionStorage(storageKey, true);

const toggleIcon = computed(() => (isOpen.value ? '▼' : '▶'));

// Get role class for styling
const roleClass = computed(() => {
  const role = props.role.toLowerCase();
  return `role-${role}`;
});

// Parse content into renderable items
const contentItems = computed(() => {
  const content = props.message.content as MessageContent;

  if (content === null || content === undefined) {
    return [];
  }

  // String content
  if (typeof content === 'string') {
    return [{ type: 'text', text: content, id: 'content-0' }];
  }

  // Array content (text + images)
  if (Array.isArray(content)) {
    return content.map((item, idx) => {
      if (item.type === 'text') {
        return {
          type: 'text',
          text: (item as TextContentItem).text,
          id: `content-${idx}`,
        };
      }
      if (item.type === 'image_url') {
        return {
          type: 'image',
          url: (item as ImageContentItem).image_url.url,
          id: `content-${idx}`,
        };
      }
      return { type: 'unknown', id: `content-${idx}` };
    });
  }

  return [];
});

// Tool calls (from assistant message)
const toolCalls = computed(() => {
  if (props.message.role !== 'assistant') return [];
  const msg = props.message as AssistantMessage;
  return msg.tool_calls || [];
});

// Tool call info (from tool message)
const toolCallInfo = computed(() => {
  if (props.message.role !== 'tool') return null;
  const msg = props.message as ToolMessage;
  return {
    id: msg.tool_call_id,
    name: msg.name,
  };
});

// Check if has content to display
const hasContent = computed(() => {
  return contentItems.value.length > 0;
});

// Check if has tool calls to display
const hasToolCalls = computed(() => {
  return toolCalls.value.length > 0;
});

// Check if message has anything to display
const hasAnything = computed(() => {
  return hasContent.value || hasToolCalls.value || toolCallInfo.value !== null;
});
</script>

<template>
  <div class="message-item" :class="roleClass">
    <div class="message-header" @click="isOpen = !isOpen" :title="id">
      <div class="message-header-left">
        <span class="toggle-icon">{{ toggleIcon }}</span>
        <span class="message-index">#{{ index + 1 }}</span>
        <RoleBadge :role="role"  />
        <span v-if="toolCallInfo?.name" class="tool-name-badge">{{ toolCallInfo.name }}</span>

        <!-- TODO1: 靠右显示, id指定为 ${id}, 不明显样式 -->
        <span v-if="toolCallInfo?.id" class="">{{ toolCallInfo.id }}</span>
      </div>
      <span v-if="id" class="message-id">{{ id.slice(0, 8) }}</span>
    </div>

    <div v-if="isOpen" class="message-content-wrapper">
      <!-- Tool call info for tool messages -->
      <div v-if="toolCallInfo" class="tool-call-info">
        <span class="tool-call-id-label">Tool Call ID:</span>
        <span class="tool-call-id-value">{{ toolCallInfo.id }}</span>
      </div>

      <!-- Content items (text and images) -->
      <template v-for="item in contentItems" :key="item.id">
        <div v-if="item.text===''" hidden=""></div>
        <TextBlock v-else-if="item.type === 'text' && typeof item.text==='string'" :id="item.id" :text="item.text" is-prose />
        <ImageBlock v-else-if="item.type === 'image'" :id="item.id" :url="item.url" />
        <div v-else>Unsupported: {{ item }}</div>
      </template>


      <!-- Empty content warning -->
      <div v-if="!hasAnything" class="empty-content">(no content)</div>

  




      <!-- Tool calls for assistant messages -->
      <div v-if="hasToolCalls" class="tool-calls">
        <div v-for="(tool, idx) in toolCalls" :key="tool.id" class="tool-call-item">
          <div class="tool-call-name">
            <span class="tool-call-badge">tool_call</span>
            
            <!-- TODO1: add link to tool def `#tool-def-${name}`  hover时样式需要能看出来是跳转连接-->
            <span>{{ tool.function.name }}</span>
            <span class="tool-call-index">#{{ idx + 1 }}</span>
            
            <!-- TODO1: add link to tool message `#${id}`, 改为不明显样式, hover时样式需要能看出来是跳转连接-->
             <!-- TODO1: 注意, 当前已经是 `/#/path...` 的路由模式, 所以使用document.querySelector('#title').scrollIntoView({ behavior: 'smooth' }) 进行跳转 -->
            <span>{{ tool.id }}</span>
          </div>
          <div class="tool-call-args">
            <pre>{{ JSON.stringify(tool.function.arguments, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-item {
  border-bottom: 2px solid rgba(126, 180, 233, 0.31);
  padding: 4px 8px;
}

.message-item:last-child {
  border-bottom: none;
}

/* Role-based left border colors */
.role-system {
  border-left: 3px solid #f59e0b;
}

.role-user {
  border-left: 3px solid #3b82f6;
}

.role-assistant {
  border-left: 3px solid #10b981;
}

.role-tool {
  border-left: 3px solid #8b5cf6;
}

.message-header {
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-header:hover {
  background: #f8fafc;
  margin: 0 -12px;
  padding: 6px 12px;
  border-radius: 4px;
}

.message-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  transition: transform 0.2s;
  color: #64748b;
  font-size: 1.2rem;
}

.message-index {
  font-size: 1.2rem;
  color: #94a3b8;
  font-weight: 500;
}

.message-id {
  font-size: 1.2rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tool-name-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 700;
  background: #f3e8ff;
  color: #7c3aed;
  font-family: 'Monaco', 'Menlo', monospace;
}

.message-content-wrapper {
  padding: 2px 16px;
  font-size: initial;
  background-color: rgba(136, 188, 197, 0.08);
  overflow-y: auto;
}

.empty-content {
  color: #94a3b8;
  font-style: italic;
  padding: 8px 0;
}

.tool-call-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  margin-bottom: 8px;
  font-size: 1.2rem;
}

.tool-call-id-label {
  color: #64748b;
  font-weight: 500;
}

.tool-call-id-value {
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tool-calls {
  margin-top: 0px;
}

.tool-call-item {
  background: #f8fafc;
  border-radius: 6px;
  padding: 2px;
  margin-bottom: 4px;
}

.tool-call-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
}

.tool-call-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #dbeafe;
  color: #1d4ed8;
}

.tool-call-index {
  color: #64748b;
  font-size: 1.2rem;
}

.tool-call-args {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 8px;
  border-radius: 4px;
  font-size: 1.28rem;
  overflow-x: auto;
}

.tool-call-args pre {
  margin: 0;
}
</style>
