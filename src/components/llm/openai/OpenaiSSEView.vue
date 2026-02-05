<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '@/utils/format/formatDate';
import type { OpenaiParsedSSEChunk } from '@/types/openai/chat-sse';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import TokenUsage from '../shared/TokenUsage.vue';
import ProseContent from '../shared/ProseContent.vue';
import OpenaiChoice from './OpenaiChoice.vue';

interface Props {
  chunks: OpenaiParsedSSEChunk[];
}

const props = defineProps<Props>();

const validChunks = computed(() => {
  return props.chunks.filter(c => c.type === 'chunk' && c.data);
});

const firstChunk = computed(() => {
  return validChunks.value[0]?.data;
});

const lastChunk = computed(() => {
  return validChunks.value[validChunks.value.length - 1]?.data;
});

const model = computed(() => {
  return firstChunk.value?.model || lastChunk.value?.model;
});

const responseId = computed(() => {
  return firstChunk.value?.id || lastChunk.value?.id;
});

// Aggregate token usage from all chunks
const aggregatedUsage = computed(() => {
  const usage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  };

  for (const chunk of validChunks.value) {
    const chunkUsage = chunk.data?.usage;
    if (chunkUsage) {
      usage.prompt_tokens += chunkUsage.prompt_tokens || 0;
      usage.completion_tokens += chunkUsage.completion_tokens || 0;
      usage.total_tokens += chunkUsage.total_tokens || 0;
    }
  }

  return usage;
});

const finishReasonClass = (reason: string | null) => {
  if (!reason) return '';
  const r = reason.toLowerCase();
  if (r === 'stop') return 'finish-stop';
  if (r === 'length') return 'finish-length';
  if (r === 'tool_calls') return 'finish-tool-calls';
  if (r === 'content_filter') return 'finish-content-filter';
  return '';
};

// Aggregate streaming content
const streamedContent = computed(() => {
  const content: string[] = [];
  for (const chunk of validChunks.value) {
    for (const choice of chunk.data?.choices || []) {
      if (choice.delta?.content) {
        content.push(choice.delta.content);
      }
    }
  }
  return content.join('');
});

// Check if any chunk has tool calls
const hasToolCalls = computed(() => {
  return validChunks.value.some(chunk =>
    chunk.data?.choices?.some(choice => choice.delta?.tool_calls)
  );
});
</script>

<template>
  <div class="openai-sse-view">
    <CollapsibleSection title="Basic Info" :default-open="true">
      <InfoItem label="Response ID" :value="responseId" />
      <InfoItem label="Model" :value="model" />
      <InfoItem label="Event Count" :value="chunks.length" />
      <InfoItem label="Chunks" :value="validChunks.length" />
    </CollapsibleSection>

    <CollapsibleSection v-if="Object.values(aggregatedUsage).some(v => v > 0)" title="Token Usage" :default-open="true">
      <TokenUsage :usage="aggregatedUsage" variant="default" />
    </CollapsibleSection>

    <CollapsibleSection v-if="streamedContent" title="Streamed Content" :default-open="true">
      <ProseContent :content="streamedContent" />
    </CollapsibleSection>

    <CollapsibleSection title="Choices Stream" :count="firstChunk?.choices?.length || 0" :default-open="true">
      <div class="choices-stream">
        <div v-for="(chunk, idx) in validChunks" :key="idx" class="chunk-item">
          <div class="chunk-header">
            <span class="chunk-index">#{{ idx + 1 }}</span>
            <span v-if="chunk.timestamp" class="chunk-timestamp">{{ formatDate(chunk.timestamp) }}</span>
          </div>
          <OpenaiChoice
            v-for="choice in chunk.data?.choices || []"
            :key="choice.index"
            :choice="choice"
            :is-stream="true"
            :finish-reason-class="finishReasonClass"
          />
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Raw Events" :default-open="false">
      <div class="events-timeline">
        <div v-for="(chunk, idx) in chunks" :key="idx" class="event-item">
          <div class="event-header">
            <span class="event-type-badge">{{ chunk.type }}</span>
            <span v-if="chunk.timestamp" class="event-timestamp">{{ formatDate(chunk.timestamp) }}</span>
          </div>
          <div v-if="chunk.data" class="event-content">
            <JsonViewer :data="chunk.data" :collapsible="true" />
          </div>
          <div v-else class="event-content raw">
            <pre>{{ chunk.raw }}</pre>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.openai-sse-view {
  padding: 2px;
}

.choices-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chunk-item {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.chunk-header {
  background: #f8fafc;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
  color: #1e293b;
}

.chunk-index {
  font-weight: 600;
}

.chunk-timestamp {
  font-size: 0.75rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
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
  justify-content: space-between;
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

.event-timestamp {
  font-size: 0.75rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.event-content {
  padding: 12px;
}

.event-content.raw {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
}

.event-content.raw pre {
  margin: 0;
  white-space: pre-wrap;
}
</style>
