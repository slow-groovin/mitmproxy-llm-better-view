<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '@/utils/format/formatDate';
import type { ClaudeResponse } from '../../../types/claude/claude-response';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import TokenUsage from '../shared/TokenUsage.vue';
import ProseContent from '../shared/ProseContent.vue';

interface Props {
  data: ClaudeResponse;
}

const props = defineProps<Props>();

const contentBlocks = computed(() => {
  return props.data.content || [];
});

const textContent = computed(() => {
  const textBlocks = contentBlocks.value.filter(b => b.type === 'text');
  return textBlocks.map(b => (b as any).text).join('');
});

const toolUseBlocks = computed(() => {
  return contentBlocks.value.filter(b => b.type === 'tool_use');
});

const thinkingBlocks = computed(() => {
  return contentBlocks.value.filter(b => b.type === 'thinking');
});

const error = computed(() => {
  return props.data.error;
});

const stopReasonClass = (reason: string) => {
  const r = reason.toLowerCase();
  if (r === 'end_turn' || r === 'stop') return 'finish-stop';
  if (r === 'max_tokens') return 'finish-length';
  if (r === 'tool_use') return 'finish-tool-calls';
  if (r === 'stop_sequence') return 'finish-stop';
  return '';
};
</script>

<template>
  <div class="claude-response-view">
    <CollapsibleSection v-if="error" title="Error" :default-open="true">
      <div class="error-section">
        <span class="error-type">{{ error.type }}</span>
        <span class="error-message">{{ error.message }}</span>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Basic Info" :default-open="true">
      <InfoItem label="ID" :value="data.id" />
      <InfoItem label="Type" :value="data.type" />
      <InfoItem label="Role" :value="data.role" />
      <InfoItem label="Model" :value="data.model" />
      <InfoItem label="Stop Reason" :value="data.stop_reason" />
      <InfoItem label="Stop Sequence" :value="data.stop_sequence" />
      <InfoItem label="Timestamp" :value="data.timestamp" />
    </CollapsibleSection>

    <CollapsibleSection title="Token Usage" :default-open="true">
      <TokenUsage :usage="data.usage" variant="default" />
    </CollapsibleSection>

    <CollapsibleSection v-if="thinkingBlocks.length > 0" title="Thinking Blocks" :count="thinkingBlocks.length" variant="default">
      <div v-for="(block, index) in thinkingBlocks" :key="index" class="thinking-summary">
        <span class="thinking-badge">thinking</span>
        <span v-if="(block as any).signature" class="thinking-signed">✓ signed</span>
        <span class="thinking-length">{{ (block as any).thinking?.length || 0 }} chars</span>
      </div>
    </CollapsibleSection>

    <CollapsibleSection v-if="textContent" title="Response Content" :default-open="true">
      <ProseContent :content="textContent" />
    </CollapsibleSection>

    <CollapsibleSection v-if="toolUseBlocks.length > 0" title="Tool Use Blocks" :count="toolUseBlocks.length" variant="tools">
      <div v-for="(block, index) in toolUseBlocks" :key="index" class="tool-use-summary">
        <span class="tool-use-badge">tool_use</span>
        <span class="tool-use-name">{{ (block as any).name }}</span>
        <span class="tool-use-id">{{ (block as any).id?.slice(0, 8) }}</span>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Full Response" :default-open="false">
      <JsonViewer :data="data" :collapsible="true" />
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.claude-response-view {
  padding: 2px;
}

.error-section {
  padding: 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-type {
  font-weight: 600;
  color: #dc2626;
  font-size: 0.875rem;
}

.error-message {
  color: #991b1b;
  font-size: 0.875rem;
}

.thinking-summary,
.tool-use-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
  margin-bottom: 8px;
}

.thinking-badge,
.tool-use-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
}

.thinking-badge {
  background: #fef3c7;
  color: #92400e;
}

.tool-use-badge {
  background: #f3e8ff;
  color: #7c3aed;
}

.tool-use-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tool-use-id {
  font-size: 0.7rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.thinking-signed {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  background: #dcfce7;
  color: #166534;
}

.thinking-length {
  font-size: 0.7rem;
  color: #64748b;
}
</style>
