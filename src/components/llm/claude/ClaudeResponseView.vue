<script setup lang="ts">
import BetterDetails from '@/components/container/BetterDetails.vue';
import { computed } from 'vue';
import type { ClaudeResponse } from '../../../types/claude/claude-response';
import CollapsibleSection from '../../container/CollapsibleSection.vue';
import LabelValueRow from '../../content/LabelValueRow.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import ClaudeResponseContentBlock from './ClaudeResponseContentBlock.vue';
import ClaudeTokenUsage from './ClaudeTokenUsage.vue';

interface Props {
  data: ClaudeResponse;
}

const props = defineProps<Props>();

// Content blocks
const contentBlocks = computed(() => props.data.content || []);

// Stop reason display
const stopReasonDisplay = computed(() => {
  const reason = props.data.stop_reason;
  if (!reason) return 'unknown';
  return reason;
});

// Stop reason class for styling
const stopReasonClass = computed(() => {
  const reason = props.data.stop_reason;
  if (!reason) return '';
  switch (reason) {
    case 'end_turn': return 'stop-end-turn';
    case 'max_tokens': return 'stop-max-tokens';
    case 'stop_sequence': return 'stop-sequence';
    case 'tool_use': return 'stop-tool-use';
    default: return '';
  }
});

// Check if has error
const hasError = computed(() => {
  return props.data.error && props.data.error !== null;
});
</script>

<template>
  <div class="claude-response-view">
    <div class="header">
      <h2>Claude Messages API Response</h2>
      <div class="meta">
        <span class="llm-label">model</span>
        <code>{{ data.model }}</code>
        <span class="divider">·</span>
        <span>{{ contentBlocks.length }} content blocks</span>
        <span class="divider">·</span>
        <span>stop: <span class="stop-reason" :class="stopReasonClass">{{ stopReasonDisplay }}</span></span>
        <span v-if="data.usage" class="divider">·</span>
        <span v-if="data.usage">{{ (data.usage.input_tokens + data.usage.output_tokens).toLocaleString() }} tokens</span>
      </div>
    </div>

    <!-- Error Section -->
    <CollapsibleSection
      v-if="hasError"
      title="Error"
      :default-open="true"
      storage-key="claude-response-error"
      variant="error"
    >
      <div class="error-content">
        <div class="error-type">{{ data.error?.type }}</div>
        <div class="error-message">{{ data.error?.message }}</div>
      </div>
    </CollapsibleSection>

    <!-- Basic Info Section -->
    <CollapsibleSection title="Basic Info" :default-open="true" storage-key="claude-response-basic">
      <LabelValueRow label="ID" :value="data.id" />
      <LabelValueRow label="Type" :value="data.type" />
      <LabelValueRow label="Role" :value="data.role" />
      <LabelValueRow label="Model" :value="data.model" />
      <LabelValueRow label="Stop Reason" :value="data.stop_reason" />
      <LabelValueRow v-if="data.stop_sequence" label="Stop Sequence" :value="data.stop_sequence" />
    </CollapsibleSection>

    <!-- Token Usage Section -->
    <CollapsibleSection
      v-if="data.usage"
      title="Token Usage"
      :default-open="true"
      storage-key="claude-response-usage"
    >
      <ClaudeTokenUsage :usage="data.usage" />
    </CollapsibleSection>

    <!-- Content Blocks Section -->
    <CollapsibleSection
      title="Content Blocks"
      :count="contentBlocks.length"
      :default-open="true"
      storage-key="claude-response-content"
      variant="default"
    >
      <div v-if="contentBlocks.length === 0" class="empty-state">
        No content blocks
      </div>
      <ClaudeResponseContentBlock
        v-for="(block, index) in contentBlocks"
        :key="index"
        :block="block"
        :index="index"
      />
    </CollapsibleSection>

    <!-- Full Response -->
    <BetterDetails title="Full Response">
      <SmartViewer :text="JSON.stringify(data, null, 2)"/>
    </BetterDetails>
  </div>
</template>

<style scoped>
.claude-response-view {
  padding: var(--llm-spacing-sm);
}

.header {
  margin-bottom: var(--llm-spacing-2xl);
  text-align: center;
}

.header h2 {
  margin: 0 0 var(--llm-spacing-md) 0;
  font-size: 2rem;
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

.stop-reason {
  padding: 2px 8px;
  border-radius: var(--llm-radius-md);
  font-size: 12px;
  font-weight: 500;
}

.stop-end-turn {
  background: var(--llm-finish-stop-bg);
  color: var(--llm-finish-stop-text);
}

.stop-max-tokens {
  background: var(--llm-finish-length-bg);
  color: var(--llm-finish-length-text);
}

.stop-sequence {
  background: var(--llm-finish-filter-bg);
  color: var(--llm-finish-filter-text);
}

.stop-tool-use {
  background: var(--llm-finish-tool-bg);
  color: var(--llm-finish-tool-text);
}

.empty-state {
  text-align: center;
  color: var(--llm-text-secondary);
  font-style: italic;
  padding: 40px 20px;
}

/* Error Section Styles */
.error-content {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.error-type {
  font-family: var(--llm-font-mono);
  font-size: 1.2rem;
  font-weight: 600;
  color: #dc2626;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.error-message {
  font-size: 1.4rem;
  color: #7f1d1d;
  line-height: 1.5;
}
</style>
