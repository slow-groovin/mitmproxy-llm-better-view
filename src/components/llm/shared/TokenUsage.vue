<script setup lang="ts">
import { computed } from 'vue';

interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  // OpenAI / Claude combined
  input_tokens?: number;
  output_tokens?: number;
  // Claude cache
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  // Gemini
  totalTokenCount?: number;
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  cachedContentTokenCount?: number;
}

interface Props {
  usage: Usage | null;
  variant?: 'default' | 'compact';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
});

// Normalize usage data
const normalizedUsage = computed(() => {
  if (!props.usage) return null;

  const u = props.usage;

  return {
    input: u.prompt_tokens || u.input_tokens || u.promptTokenCount || 0,
    output: u.completion_tokens || u.output_tokens || u.candidatesTokenCount || 0,
    total: u.total_tokens || u.totalTokenCount || 0,
    cacheRead: u.cache_read_input_tokens || u.cachedContentTokenCount || 0,
    cacheWrite: u.cache_creation_input_tokens || 0
  };
});

const hasCacheTokens = computed(() => {
  return normalizedUsage.value &&
         (normalizedUsage.value.cacheRead > 0 || normalizedUsage.value.cacheWrite > 0);
});
</script>

<template>
  <div v-if="normalizedUsage" class="token-usage" :class="variant">
    <div v-if="variant === 'default'" class="usage-grid">
      <div class="usage-item">
        <div class="usage-label">Input Tokens</div>
        <div class="usage-value">{{ normalizedUsage.input.toLocaleString() }}</div>
      </div>
      <div class="usage-item">
        <div class="usage-label">Output Tokens</div>
        <div class="usage-value">{{ normalizedUsage.output.toLocaleString() }}</div>
      </div>
      <div v-if="normalizedUsage.total > 0" class="usage-item">
        <div class="usage-label">Total Tokens</div>
        <div class="usage-value">{{ normalizedUsage.total.toLocaleString() }}</div>
      </div>
      <div v-if="hasCacheTokens && normalizedUsage.cacheRead > 0" class="usage-item cache">
        <div class="usage-label">Cache Read</div>
        <div class="usage-value">{{ normalizedUsage.cacheRead.toLocaleString() }}</div>
      </div>
      <div v-if="hasCacheTokens && normalizedUsage.cacheWrite > 0" class="usage-item cache">
        <div class="usage-label">Cache Write</div>
        <div class="usage-value">{{ normalizedUsage.cacheWrite.toLocaleString() }}</div>
      </div>
    </div>
    <div v-else class="usage-compact">
      <span class="usage-text">{{ normalizedUsage.input.toLocaleString() }} in / {{ normalizedUsage.output.toLocaleString() }} out</span>
      <span v-if="normalizedUsage.total > 0" class="usage-total">{{ normalizedUsage.total.toLocaleString() }} total</span>
    </div>
  </div>
</template>

<style scoped>
.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.usage-item {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.usage-item.cache {
  background: #f0fdf4;
  border-color: #86efac;
}

.usage-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 4px;
}

.usage-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.usage-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.usage-text {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
}

.usage-total {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
  padding: 2px 6px;
  background: #e2e8f0;
  border-radius: 4px;
}
</style>
