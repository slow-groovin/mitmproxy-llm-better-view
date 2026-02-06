<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Choice, StreamChoice } from '@/types/openai/chat-response';
import ProseContent from '../shared/ProseContent.vue';
import ToolCall from '../tools/ToolCall.vue';

interface Props {
  choice: Choice | StreamChoice;
  isStream?: boolean;
  finishReasonClass?: (reason: string | null) => string;
}

const props = withDefaults(defineProps<Props>(), {
  isStream: false,
  finishReasonClass: () => ''
});

const isOpen = ref(true);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

// Determine if this is a streaming choice
const isStreamingChoice = computed(() => {
  return 'delta' in props.choice;
});

const message = computed(() => {
  if (isStreamingChoice.value) {
    return (props.choice as StreamChoice).delta;
  }
  return (props.choice as Choice).message;
});

const finishReason = computed(() => {
  if (isStreamingChoice.value) {
    return (props.choice as StreamChoice).finish_reason;
  }
  return (props.choice as Choice).finish_reason;
});

const toolCalls = computed(() => {
  if (isStreamingChoice.value) {
    return (props.choice as StreamChoice).delta?.tool_calls || [];
  }
  return (props.choice as Choice).message?.tool_calls || [];
});

const content = computed(() => {
  if (isStreamingChoice.value) {
    return (props.choice as StreamChoice).delta?.content || '';
  }
  return (props.choice as Choice).message?.content || '';
});

const refusal = computed(() => {
  if (isStreamingChoice.value) return null;
  return (props.choice as Choice).message?.refusal || null;
});

const finishReasonClassValue = computed(() => {
  return props.finishReasonClass ? props.finishReasonClass(finishReason.value) : '';
});
</script>

<template>
  <div class="choice-item">
    <div class="choice-header" @click="isOpen = !isOpen">
      <div class="choice-meta">
        <span class="choice-index">Choice #{{ choice.index + 1 }}</span>
        <span v-if="isStream" class="choice-badge">streaming</span>
        <span v-if="finishReason" class="finish-reason-badge" :class="finishReasonClassValue">
          {{ finishReason }}
        </span>
      </div>
      <span class="toggle-icon">{{ toggleIcon }}</span>
    </div>
    <div v-if="isOpen" class="choice-content">
      <div v-if="refusal" class="refusal">
        <span class="refusal-badge">refusal</span>
        <span class="refusal-text">{{ refusal }}</span>
      </div>

      <div v-if="content" class="choice-message">
        <ProseContent :content="content" />
      </div>

      <div v-if="toolCalls.length > 0" class="tool-calls-container">
        <h4>Tool Calls</h4>
        <ToolCall
          v-for="(tool, idx) in toolCalls"
          :key="tool.id || idx"
          :id="tool.id"
          :name="tool.function.name"
          :arguments="tool.function.arguments"
          :index="idx"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.choice-item {
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.choice-header {
  background: #f8fafc;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  width: 100%;
  text-align: left;
}

.choice-header:hover {
  background: #f1f5f9;
}

.choice-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.choice-index {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
}

.choice-badge {
  background: #10b981;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 1.2000000000000002rem;
  font-weight: 600;
}

.toggle-icon {
  transition: transform 0.2s;
  color: #64748b;
  font-size: 1.2000000000000002rem;
}

.choice-content {
  padding: 16px;
}

.refusal {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.refusal-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #dc2626;
  color: white;
}

.refusal-text {
  color: #991b1b;
  font-size: 1.4rem;
}

.choice-message {
  margin-bottom: 12px;
}

.tool-calls-container {
  margin-top: 16px;
}

.tool-calls-container h4 {
  margin-bottom: 12px;
  font-size: 1.4400000000000002rem;
  color: #1e293b;
  font-weight: 600;
}

.finish-reason-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 1.2000000000000002rem;
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
