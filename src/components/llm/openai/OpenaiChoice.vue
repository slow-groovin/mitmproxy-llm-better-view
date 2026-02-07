<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Choice } from '@/types/openai/chat-response';
import BetterDetails from '@/components/container/BetterDetails.vue';
import TextBlock from '@/components/content/TextBlock.vue';
import OpenaiAssistantToolCalls from './OpenaiAssistantToolCalls.vue';

interface Props {
  choice: Choice;
  isStream?: boolean;
  finishReasonClass?: (reason: string | null) => string;
  showHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isStream: false,
  finishReasonClass: () => '',
  showHeader: true
});

const isOpen = ref(true);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

// Determine if this is a streaming choice
const isStreamingChoice = computed(() => {
  return 'delta' in props.choice;
});

const toolCalls = computed(() => {
  if (isStreamingChoice.value) {
    return (props.choice).message?.tool_calls || [];
  }
  return (props.choice as Choice).message?.tool_calls || [];
});

const content = computed(() => {
  if (isStreamingChoice.value) {
    return (props.choice).message?.content || '';
  }
  return (props.choice as Choice).message?.content || '';
});

const reasoning = computed(() => {
  if (isStreamingChoice.value) {
    return (props.choice).message?.reasoning || '';
  }
  return (props.choice as Choice).message?.reasoning || '';
});

const refusal = computed(() => {
  if (isStreamingChoice.value) return null;
  return (props.choice as Choice).message?.refusal || null;
});

const finishReason = computed(() => {
  return props.choice.finish_reason;
});
</script>

<template>
  <div class="choice-item" :class="{ 'no-header': !showHeader }">
    <!-- Choice[i] 的 Header区, 因为99%情况是只有一个choice, 所以在仅单个choice的情况下不显示 -->
    <div v-if="showHeader" class="choice-header" @click="isOpen = !isOpen">
      <div class="choice-meta">
        <span class="choice-index">#{{ choice.index + 1 }}</span>
        <span v-if="isStream" class="choice-badge">streaming</span>
        <span v-if="finishReason" class="finish-reason-badge" :class="finishReasonClass(finishReason)">
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

      <div v-if="reasoning" class="">
        <BetterDetails title="reasoning">
          <div class="reasoning">
            <TextBlock :text="reasoning" />
          </div>
        </BetterDetails>
      </div>

      <div v-if="content" class="choice-message">
        <TextBlock :text="content" />
      </div>
      <OpenaiAssistantToolCalls v-if="toolCalls.length > 0" :tool-calls="toolCalls" variant="compact" />
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
  padding: 8px 6px;
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

.finish-reason-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 500;
  text-transform: lowercase;
}

.toggle-icon {
  transition: transform 0.2s;
  color: #64748b;
  font-size: 1.2000000000000002rem;
}

.choice-content {
  padding: 6px;
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

.reasoning {
  margin-bottom: 12px;
  border-left: 3px solid #8b5cf6;
  background: #f5f3ff;
  border-radius: 0 6px 6px 0;
}

.reasoning-label {
  padding: 4px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #7c3aed;
  background: #ede9fe;
  border-radius: 0 4px 0 0;
  display: inline-block;
}

.reasoning-content {
  padding: 8px 12px;
  color: #5b21b6;
}

.reasoning-content :deep(p) {
  margin: 0 0 8px 0;
}

.reasoning-content :deep(p:last-child) {
  margin-bottom: 0;
}

.choice-message {
  margin-bottom: 12px;
}

.tool-calls-container {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
