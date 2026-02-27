<script setup lang="ts">
import { computed } from 'vue';
import { hashId } from '@/utils/id/hashId';
import SmartViewer from '@/components/content/SmartViewer.vue';
import ImageBlock from '@/components/content/ImageBlock.vue';
import ToolArgs from '@/components/llm/ToolArgs.vue';
import MessageItem from '../MessageItem.vue';
import SubMessageItem from '../SubMessageItem.vue';
import type {
  OpenaiResponseInputItem,
  OpenaiResponseMessageItem,
  OpenaiResponseReasoningItem,
  OpenaiResponseFunctionCallItem,
  OpenaiResponseFunctionCallOutputItem,
  OpenaiResponseCustomToolCallItem,
  OpenaiResponseCustomToolCallOutputItem,
  OpenaiResponseMessageContentItem,
} from '@/types/openai-response/response-request';

interface Props {
  id: string;
  item: OpenaiResponseInputItem;
  index: number;
}

const props = defineProps<Props>();

type BadgeType = 'text' | 'image' | 'tool' | 'thinking' | 'system';
type DisplayContentItem = {
  id: string;
  badgeType: BadgeType;
  badgeText: string;
  text?: string;
  imageUrl?: string;
  raw?: unknown;
};

const isMessageItem = (item: OpenaiResponseInputItem): item is OpenaiResponseMessageItem => item.type === 'message';
const isReasoningItem = (item: OpenaiResponseInputItem): item is OpenaiResponseReasoningItem => item.type === 'reasoning';
const isFunctionCallItem = (item: OpenaiResponseInputItem): item is OpenaiResponseFunctionCallItem => item.type === 'function_call';
const isFunctionCallOutputItem = (item: OpenaiResponseInputItem): item is OpenaiResponseFunctionCallOutputItem => item.type === 'function_call_output';
const isCustomToolCallItem = (item: OpenaiResponseInputItem): item is OpenaiResponseCustomToolCallItem => item.type === 'custom_tool_call';
const isCustomToolCallOutputItem = (item: OpenaiResponseInputItem): item is OpenaiResponseCustomToolCallOutputItem => item.type === 'custom_tool_call_output';

const stringifyUnknown = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const itemRole = computed(() => {
  if (isMessageItem(props.item)) return props.item.role;
  if (isReasoningItem(props.item)) return 'assistant';
  if (isFunctionCallItem(props.item) || isCustomToolCallItem(props.item)) return 'assistant';
  if (isFunctionCallOutputItem(props.item) || isCustomToolCallOutputItem(props.item)) return 'tool';
  return 'system';
});

const getContentItemView = (contentItem: OpenaiResponseMessageContentItem, idx: number): DisplayContentItem => {
  // 把 content item 统一映射为展示结构，模板层只管渲染。
  if (contentItem.type === 'input_text' || contentItem.type === 'output_text' || contentItem.type === 'summary_text') {
    return {
      id: `content-${idx}`,
      badgeType: 'text',
      badgeText: contentItem.type.toUpperCase(),
      text: typeof contentItem.text === 'string' ? contentItem.text : '',
    };
  }

  if (contentItem.type === 'input_image') {
    return {
      id: `content-${idx}`,
      badgeType: 'image',
      badgeText: 'INPUT_IMAGE',
      imageUrl: typeof contentItem.image_url === 'string' ? contentItem.image_url : undefined,
      raw: contentItem,
    };
  }

  if (contentItem.type === 'input_file') {
    const fileText = [
      contentItem.file_id ? `file_id: ${contentItem.file_id}` : '',
      contentItem.filename ? `filename: ${contentItem.filename}` : '',
    ].filter(Boolean).join('\n');

    return {
      id: `content-${idx}`,
      badgeType: 'system',
      badgeText: 'INPUT_FILE',
      text: fileText || stringifyUnknown(contentItem),
      raw: contentItem,
    };
  }

  return {
    id: `content-${idx}`,
    badgeType: 'text',
    badgeText: contentItem.type.toUpperCase(),
    text: stringifyUnknown(contentItem),
    raw: contentItem,
  };
};

const messageContentItems = computed<DisplayContentItem[]>(() => {
  if (!isMessageItem(props.item)) return [];

  const content = props.item.content;
  if (typeof content === 'string') {
    return [
      {
        id: 'content-0',
        badgeType: 'text',
        badgeText: 'TEXT',
        text: content,
      },
    ];
  }

  if (Array.isArray(content)) {
    return content.map((contentItem, idx) => getContentItemView(contentItem, idx));
  }

  return [];
});

const reasoningSummaries = computed(() => {
  if (!isReasoningItem(props.item)) return [];
  return props.item.summary || [];
});

const hasReasoningContent = computed(() => {
  if (!isReasoningItem(props.item)) return false;
  return props.item.content !== null && props.item.content !== undefined;
});

const hasEncryptedReasoning = computed(() => {
  if (!isReasoningItem(props.item)) return false;
  return typeof props.item.encrypted_content === 'string' && props.item.encrypted_content.length > 0;
});

const callId = computed(() => {
  if ('call_id' in props.item && typeof props.item.call_id === 'string') {
    return props.item.call_id;
  }
  return null;
});

const callHash = computed(() => {
  if (!callId.value) return null;
  return hashId(callId.value);
});

const callAnchorId = computed(() => {
  if (!callHash.value) return null;
  return `openai-response-call-${callHash.value}`;
});

const outputAnchorId = computed(() => {
  if (!callHash.value) return null;
  return `openai-response-output-${callHash.value}`;
});

const containerDomId = computed(() => {
  if (isFunctionCallItem(props.item) || isCustomToolCallItem(props.item)) {
    return callAnchorId.value || `openai-response-input-${props.id}`;
  }
  if (isFunctionCallOutputItem(props.item) || isCustomToolCallOutputItem(props.item)) {
    return outputAnchorId.value || `openai-response-input-${props.id}`;
  }
  return `openai-response-input-${props.id}`;
});

const itemCount = computed(() => {
  if (isMessageItem(props.item)) return messageContentItems.value.length;
  if (isReasoningItem(props.item)) return reasoningSummaries.value.length + (hasReasoningContent.value ? 1 : 0);
  return 1;
});

const functionCallArguments = computed(() => {
  if (!isFunctionCallItem(props.item)) return '';
  return props.item.arguments;
});

const functionCallOutputText = computed(() => {
  if (!isFunctionCallOutputItem(props.item)) return '';
  return stringifyUnknown(props.item.output);
});

const customToolCallArguments = computed(() => {
  if (!isCustomToolCallItem(props.item)) return '';
  const input = props.item.input;
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object') return input;
  return stringifyUnknown(input);
});

const customToolCallOutputText = computed(() => {
  if (!isCustomToolCallOutputItem(props.item)) return '';
  return stringifyUnknown(props.item.output);
});

const itemRawText = computed(() => JSON.stringify(props.item, null, 2));

const scrollToId = (targetId: string | null) => {
  if (!targetId) return;
  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
</script>

<template>
  <div :id="containerDomId">
    <MessageItem
      :id="id"
      :index="String(index)"
      :role="itemRole"
      :count="itemCount"
      :data-as-text="itemRawText"
      storage-prefix="openai-response-input"
    >
      <div class="input-item-body">
        <template v-if="isMessageItem(item)">
          <div v-if="messageContentItems.length === 0" class="empty-state">
            Empty message content
          </div>
          <SubMessageItem
            v-for="(contentItem, contentIndex) in messageContentItems"
            :key="contentItem.id"
            :id="`${id}-${contentItem.id}`"
            :index="`${index}-${contentIndex + 1}`"
            :badge-type="contentItem.badgeType"
            :badge-text="contentItem.badgeText"
            storage-prefix="openai-response-input-sub"
          >
            <ImageBlock
              v-if="contentItem.badgeType === 'image' && contentItem.imageUrl"
              :url="contentItem.imageUrl"
            />
            <SmartViewer
              v-else
              :text="contentItem.text || stringifyUnknown(contentItem.raw)"
            />
          </SubMessageItem>
          <div v-if="item.phase" class="meta-note">
            phase: <code>{{ item.phase }}</code>
          </div>
        </template>

        <template v-else-if="isReasoningItem(item)">
          <SubMessageItem
            v-for="(summaryItem, summaryIndex) in reasoningSummaries"
            :key="`summary-${summaryIndex}`"
            :id="`${id}-summary-${summaryIndex}`"
            :index="`${index}-${summaryIndex + 1}`"
            badge-type="thinking"
            badge-text="SUMMARY"
            storage-prefix="openai-response-input-sub"
          >
            <SmartViewer :text="summaryItem.text" />
          </SubMessageItem>
          <SubMessageItem
            v-if="hasReasoningContent"
            :id="`${id}-reasoning-content`"
            :index="`${index}-${reasoningSummaries.length + 1}`"
            badge-type="thinking"
            badge-text="CONTENT"
            storage-prefix="openai-response-input-sub"
          >
            <SmartViewer :text="stringifyUnknown(item.content)" />
          </SubMessageItem>
          <div v-if="hasEncryptedReasoning" class="meta-note">
            encrypted reasoning content is hidden
          </div>
        </template>

        <template v-else-if="isFunctionCallItem(item)">
          <div class="call-header">
            <span class="call-badge">FUNCTION_CALL</span>
            <code class="call-name">{{ item.name }}</code>
            <a
              v-if="outputAnchorId && callId"
              class="call-link"
              @click.prevent="scrollToId(outputAnchorId)"
            >
              {{ callId }}
            </a>
          </div>
          <ToolArgs :arguments="functionCallArguments" />
        </template>

        <template v-else-if="isFunctionCallOutputItem(item)">
          <div class="call-header">
            <span class="call-badge output">FUNCTION_OUTPUT</span>
            <a
              v-if="callAnchorId && callId"
              class="call-link"
              @click.prevent="scrollToId(callAnchorId)"
            >
              {{ callId }}
            </a>
          </div>
          <SmartViewer :text="functionCallOutputText" />
        </template>

        <template v-else-if="isCustomToolCallItem(item)">
          <div class="call-header">
            <span class="call-badge">CUSTOM_TOOL_CALL</span>
            <code class="call-name">{{ item.name }}</code>
            <span v-if="item.status" class="status-badge">{{ item.status }}</span>
            <a
              v-if="outputAnchorId && callId"
              class="call-link"
              @click.prevent="scrollToId(outputAnchorId)"
            >
              {{ callId }}
            </a>
          </div>
          <ToolArgs :arguments="customToolCallArguments" />
        </template>

        <template v-else-if="isCustomToolCallOutputItem(item)">
          <div class="call-header">
            <span class="call-badge output">CUSTOM_TOOL_OUTPUT</span>
            <a
              v-if="callAnchorId && callId"
              class="call-link"
              @click.prevent="scrollToId(callAnchorId)"
            >
              {{ callId }}
            </a>
          </div>
          <SmartViewer :text="customToolCallOutputText" />
        </template>

        <template v-else>
          <SmartViewer :text="itemRawText" />
        </template>
      </div>
    </MessageItem>
  </div>
</template>

<style scoped>
.input-item-body {
  padding: var(--llm-spacing-xs) 0;
}

.empty-state {
  color: var(--llm-text-muted);
  font-style: italic;
  padding: 4px 0;
}

.call-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.call-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 1.05rem;
  font-weight: 600;
  background: var(--llm-badge-tool-bg);
  color: var(--llm-badge-tool-text);
}

.call-badge.output {
  background: #e2e8f0;
  color: #334155;
}

.call-name {
  font-size: 1.2rem;
  color: #334155;
}

.status-badge {
  font-size: 1.05rem;
  font-weight: 600;
  color: #065f46;
  background: #d1fae5;
  padding: 1px 6px;
  border-radius: 4px;
}

.call-link {
  margin-left: auto;
  font-family: var(--llm-font-mono);
  font-size: 1.05rem;
  color: #1d4ed8;
  text-decoration: none;
  cursor: pointer;
}

.call-link:hover {
  text-decoration: underline;
}

.meta-note {
  margin-top: 8px;
  font-size: 1.1rem;
  color: var(--llm-text-secondary);
}

.meta-note code {
  font-family: var(--llm-font-mono);
  color: #334155;
}
</style>
