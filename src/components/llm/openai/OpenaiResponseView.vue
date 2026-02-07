<script setup lang="ts">
import { computed } from 'vue';
import type { OpenaiChatResponse } from '../../../types/openai/chat-response';
import CollapsibleSection from '../../container/CollapsibleSection.vue';
import InfoItem from '../../content/KVRowLine.vue';
import JsonViewer from '../../content/JsonViewer.vue';
import OpenaiTokenUsage from './OpenaiTokenUsage.vue';
import OpenaiChoice from './OpenaiChoice.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';

interface Props {
  data: OpenaiChatResponse;
}

const props = defineProps<Props>();

const choices = computed(() => {
  return props.data.choices || [];
});

const totalTokens = computed(() => {
  return props.data.usage?.total_tokens || 0;
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

const getFinishReasonSummary = () => {
  const reasons = choices.value
    .map(c => c.finish_reason)
    .filter((r): r is string => !!r);
  if (reasons.length === 0) return '';
  const unique = [...new Set(reasons)];
  return unique.join(', ');
};
</script>

<template>
  <div class="openai-response-view">
    <div class="header">
      <h2>OpenAI Chat Completions API Response</h2>
      <div class="meta">
        <code>{{ data.model }}</code>
        <span class="divider">·</span>
        <span>{{ choices.length }} choices</span>
        <span class="divider">·</span>
        <span>{{ totalTokens.toLocaleString() }} tokens</span>
        <span v-if="getFinishReasonSummary()" class="divider">·</span>
        <span v-if="getFinishReasonSummary()">
          finish_reason: <span class="finish-summary" :class="finishReasonClass(getFinishReasonSummary())">{{
            getFinishReasonSummary() }}</span>
        </span>
      </div>
    </div>

    <CollapsibleSection title="Basic Info" :default-open="true" storage-key="response-basic">
      <InfoItem label="ID" :value="data.id" />
      <InfoItem label="Object" :value="data.object" />
      <InfoItem label="Model" :value="data.model" />
      <InfoItem label="System Fingerprint" :value="data.system_fingerprint" />
    </CollapsibleSection>

    <CollapsibleSection v-if="data.usage" title="Token Usage" :default-open="true" storage-key="response-usage">
      <OpenaiTokenUsage :usage="data.usage" />
    </CollapsibleSection>

    <CollapsibleSection title="Choices" :count="choices.length" :default-open="true" storage-key="response-choices"
      variant="default">
      <div v-if="choices.length === 0" class="empty-state">
        No choices
      </div>
      <OpenaiChoice v-for="choice in choices" :key="choice.index" :choice="choice"
        :finish-reason-class="finishReasonClass" />
    </CollapsibleSection>

    <BetterDetails title="Full Response">
      <JsonViewer :data="data" />
    </BetterDetails>

  </div>
</template>

<style scoped>
.openai-response-view {
  padding: 2px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  flex-wrap: wrap;
}

.meta code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
  font-family: 'SF Mono', Consolas, monospace;
  color: #374151;
}

.divider {
  color: #d1d5db;
}

.empty-state {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 40px 20px;
}

.finish-summary {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.finish-stop {
  background: #dcfce7;
  color: #166534;
}

.finish-length {
  background: #fef3c7;
  color: #92400e;
}

.finish-tool-calls {
  background: #dbeafe;
  color: #1e40af;
}

.finish-content-filter {
  background: #fecaca;
  color: #991b1b;
}
</style>
