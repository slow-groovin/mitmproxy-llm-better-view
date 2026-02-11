<script setup lang="ts">
import { computed } from 'vue';
import { hashId } from '@/utils/id/hashId';
import SmartViewer from '../../content/SmartViewer.vue';
import ImageBlock from '../../content/ImageBlock.vue';
import type {
  OpenaiChatMessage,
  MessageContent,
  AssistantMessage,
  ToolMessage,
  TextContentItem,
  ImageContentItem,
} from '@/types/openai/chat-request';
import OpenaiAssistantToolCalls from './OpenaiAssistantToolCalls.vue';
import MessageItem from '../MessageItem.vue';
import SubMessageItem from '../SubMessageItem.vue';

interface Props {
  id?: string;
  role: string;
  index: number;
  message: OpenaiChatMessage;
}

const props = defineProps<Props>();

// 生成消息唯一的 Hash ID
const msgHashId = hashId(JSON.stringify(props.message));

// 内容项解析 - 标准化为统一格式
const contentItems = computed(() => {
  const content = props.message.content as MessageContent;
  if (!content) return [];

  // 纯字符串 - 单文本内容
  if (typeof content === 'string') {
    return [{ type: 'text' as const, text: content, id: 'content-0' }];
  }

  // 数组 - 多内容项
  if (Array.isArray(content)) {
    return content.map((item, idx) => {
      if (item.type === 'text') {
        return {
          type: 'text' as const,
          text: (item as TextContentItem).text,
          id: `content-${idx}`,
        };
      } else if (item.type === 'image_url') {
        return {
          type: 'image' as const,
          url: (item as ImageContentItem).image_url.url,
          id: `content-${idx}`,
        };
      }
      return { type: 'unknown' as const, id: `content-${idx}` };
    });
  }

  return [];
});

// 是否有多个内容项
const hasMultipleContent = computed(() => contentItems.value.length > 1);

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
  <MessageItem
    :count="contentItems.length + toolRequests.length"
    :data-as-text="JSON.stringify(message, null, 2)"
    :id="id"
    :index="String(index)"
    :role="role"
    storage-prefix="openai-msg"
  >
    <div class="message-content-flow">
      <!-- 内容区域 -->
      <template v-if="hasContent">
        <!-- 单内容项：直接显示，不使用 SubMessageItem -->
        <template v-if="!hasMultipleContent">
          <template v-for="item in contentItems" :key="item.id">
            <SmartViewer v-if="item.type === 'text' && item.text" :text="item.text" />
            <ImageBlock v-else-if="item.type === 'image' && item.url" :url="item.url" />
          </template>
        </template>

        <!-- 多内容项：使用 SubMessageItem 分别包裹 -->
        <template v-else>
          <SubMessageItem
            v-for="(item, subIndex) in contentItems"
            :key="item.id"
            :badge-type="item.type === 'image' ? 'image' : 'text'"
            :badge-text="item.type === 'image' ? 'IMAGE' : 'TEXT'"
            :id="`${msgHashId}-${item.id}`"
            :index="`${index}-${subIndex + 1}`"
            storage-prefix="openai-sub"
          >
            <SmartViewer v-if="item.type === 'text' && item.text" :text="item.text" />
            <ImageBlock v-else-if="item.type === 'image' && item.url" :url="item.url" />
          </SubMessageItem>
        </template>
      </template>

      <div v-else class="empty" hidden></div>

      <!-- 工具调用 -->
      <OpenaiAssistantToolCalls v-if="toolRequests.length" :tool-calls="toolRequests" />
    </div>
  </MessageItem>
</template>

<style scoped>
.message-content-flow {
  padding: var(--llm-spacing-xs) 0;
}

.empty {
  color: var(--llm-text-muted);
  font-style: italic;
  padding: 8px 0;
}
</style>
