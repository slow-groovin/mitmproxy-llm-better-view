<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '@/utils/format/formatDate';
import type { SSEEvent, SSEEventData } from '@/types/claude/claude-sse';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import TokenUsage from '../shared/TokenUsage.vue';

interface Props {
  events: SSEEvent[];
}

const props = defineProps<Props>();

const messageType = computed(() => {
  const msgStart = props.events.find(e => e.event === 'message_start');
  if (!msgStart) return null;
  const data = msgStart.data as any;
  return data.message;
});

const usage = computed(() => {
  if (!messageType.value) return null;
  return messageType.value.usage;
});

const model = computed(() => {
  if (!messageType.value) return null;
  return messageType.value.model;
});

const responseId = computed(() => {
  if (!messageType.value) return null;
  return messageType.value.id;
});

const stopReason = computed(() => {
  const msgDelta = props.events.find(e => e.event === 'message_delta');
  if (!msgDelta) return null;
  const data = msgDelta.data as any;
  return data.delta?.stop_reason;
});

// Aggregate content blocks
const contentBlocks = computed(() => {
  const blocks: Record<number, any> = {};

  for (const event of props.events) {
    if (event.event === 'content_block_start') {
      const data = event.data as any;
      blocks[data.index] = {
        index: data.index,
        type: data.content_block?.type,
        ...data.content_block
      };
    } else if (event.event === 'content_block_delta') {
      const data = event.data as any;
      const index = data.index;
      if (!blocks[index]) continue;

      const delta = data.delta;
      if (delta.type === 'text_delta') {
        blocks[index].text = (blocks[index].text || '') + delta.text;
      } else if (delta.type === 'thinking_delta') {
        blocks[index].thinking = (blocks[index].thinking || '') + (delta as any).thinking;
      }
    }
  }

  return Object.values(blocks);
});

const textContent = computed(() => {
  const textBlocks = contentBlocks.value.filter(b => b.type === 'text');
  return textBlocks.map(b => b.text || '').join('');
});

const thinkingContent = computed(() => {
  const thinkingBlocks = contentBlocks.value.filter(b => b.type === 'thinking');
  return thinkingBlocks.map(b => b.thinking || '').join('');
});
</script>

<template>
  <div class="claude-sse-view">
    <CollapsibleSection title="Basic Info" :default-open="true">
      <InfoItem label="Response ID" :value="responseId" />
      <InfoItem label="Model" :value="model" />
      <InfoItem label="Event Count" :value="events.length" />
      <InfoItem label="Stop Reason" :value="stopReason" />
    </CollapsibleSection>

    <CollapsibleSection v-if="usage" title="Token Usage" :default-open="true">
      <TokenUsage :usage="usage" variant="default" />
    </CollapsibleSection>

    <CollapsibleSection v-if="thinkingContent" title="Thinking Content" :default-open="false">
      <pre class="thinking-content">{{ thinkingContent }}</pre>
    </CollapsibleSection>

    <CollapsibleSection v-if="textContent" title="Streamed Content" :default-open="true">
      <pre class="streamed-content">{{ textContent }}</pre>
    </CollapsibleSection>

    <CollapsibleSection title="Raw Events" :default-open="false">
      <div class="events-timeline">
        <div v-for="(event, index) in events" :key="index" class="event-item">
          <div class="event-header">
            <span class="event-type-badge">{{ event.event }}</span>
            <span class="event-index">#{{ index + 1 }}</span>
          </div>
          <div class="event-content">
            <JsonViewer :data="event.data" :collapsible="true" />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.claude-sse-view {
  padding: 2px;
}

.thinking-content,
.streamed-content {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  white-space: pre-wrap;
  overflow-x: auto;
  line-height: 1.6;
}

.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-item {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.event-header {
  background: #f8fafc;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  width: 100%;
  text-align: left;
}

.event-header:hover {
  background: #f1f5f9;
}

.event-type-badge {
  background: #e5e7eb;
  color: #374151;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
}

.event-index {
  font-size: 0.75rem;
  color: #64748b;
}

.event-content {
  padding: 12px;
}
</style>
