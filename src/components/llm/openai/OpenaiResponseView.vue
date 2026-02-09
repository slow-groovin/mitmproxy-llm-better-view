<script setup lang="ts">
import { computed } from 'vue';
import type { OpenaiChatResponse } from '../../../types/openai/chat-response';
import CollapsibleSection from '../../container/CollapsibleSection.vue';
import LabelValueRow from '../../content/LabelValueRow.vue';
import OpenaiTokenUsage from './OpenaiTokenUsage.vue';
import OpenaiChoice from './OpenaiChoice.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '../../content/SmartViewer.vue';

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
        <span class="llm-label">model</span>
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
      <LabelValueRow label="ID" :value="data.id" />
      <LabelValueRow label="Object" :value="data.object" />
      <LabelValueRow label="Model" :value="data.model" />
      <LabelValueRow label="System Fingerprint" :value="data.system_fingerprint" />
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
        :finish-reason-class="finishReasonClass" :show-header="choices.length > 1" />
    </CollapsibleSection>

    <BetterDetails title="Full Response">
      <SmartViewer :text="JSON.stringify(data,null,2)"/>
    </BetterDetails>

  </div>
</template>

<style scoped>
.openai-response-view {
  padding: var(--llm-spacing-sm);
}

.header {
  margin-bottom: var(--llm-spacing-2xl);
  text-align: center;
}

.header h2 {
  margin: 0 0 var(--llm-spacing-md) 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--llm-spacing-md);
  font-size: 14px;
  color: #6b7280;
  flex-wrap: wrap;
}

.meta code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: var(--llm-radius-sm);
  font-size: 13px;
  font-family: var(--llm-font-mono);
  color: #374151;
}

.divider {
  color: #d1d5db;
}

.empty-state {
  text-align: center;
  color: var(--llm-text-secondary);
  font-style: italic;
  padding: 40px 20px;
}

.finish-summary {
  padding: 2px 8px;
  border-radius: var(--llm-radius-md);
  font-size: 12px;
  font-weight: 500;
}

.finish-stop {
  background: var(--llm-finish-stop-bg);
  color: var(--llm-finish-stop-text);
}

.finish-length {
  background: var(--llm-finish-length-bg);
  color: var(--llm-finish-length-text);
}

.finish-tool-calls {
  background: var(--llm-finish-tool-bg);
  color: var(--llm-finish-tool-text);
}

.finish-content-filter {
  background: var(--llm-finish-filter-bg);
  color: var(--llm-finish-filter-text);
}
</style>
