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
  // Detailed token breakdown
  prompt_tokens_details?: {
    cached_tokens?: number;
    text_tokens?: number;
    audio_tokens?: number;
    image_tokens?: number;
  };
  completion_tokens_details?: {
    text_tokens?: number;
    audio_tokens?: number;
    reasoning_tokens?: number;
  };
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

  // Input tokens calculation
  const promptTokens = u.prompt_tokens || u.input_tokens || u.promptTokenCount || 0;
  const cachedTokens = u.prompt_tokens_details?.cached_tokens ||
                       u.cache_read_input_tokens ||
                       u.cachedContentTokenCount || 0;

  // Output tokens calculation
  const completionTokens = u.completion_tokens || u.output_tokens || u.candidatesTokenCount || 0;

  // Cache write tokens (Claude specific)
  const cacheWriteTokens = u.cache_creation_input_tokens || 0;

  // Detailed breakdown
  const promptTextTokens = u.prompt_tokens_details?.text_tokens || 0;
  const promptAudioTokens = u.prompt_tokens_details?.audio_tokens || 0;
  const promptImageTokens = u.prompt_tokens_details?.image_tokens || 0;

  const completionTextTokens = u.completion_tokens_details?.text_tokens || 0;
  const completionAudioTokens = u.completion_tokens_details?.audio_tokens || 0;
  const reasoningTokens = u.completion_tokens_details?.reasoning_tokens || 0;

  return {
    // Basic counts
    prompt: promptTokens,
    completion: completionTokens,
    total: u.total_tokens || u.totalTokenCount || (promptTokens + completionTokens),

    // Cache information
    cached: cachedTokens,
    cacheWrite: cacheWriteTokens,

    // Detailed input breakdown
    promptText: promptTextTokens,
    promptAudio: promptAudioTokens,
    promptImage: promptImageTokens,

    // Detailed output breakdown
    completionText: completionTextTokens,
    completionAudio: completionAudioTokens,
    reasoning: reasoningTokens,

    // Has detailed info flags
    hasDetailedInput: promptTextTokens > 0 || promptAudioTokens > 0 || promptImageTokens > 0,
    hasDetailedOutput: completionTextTokens > 0 || completionAudioTokens > 0 || reasoningTokens > 0,
    hasCacheInfo: cachedTokens > 0 || cacheWriteTokens > 0
  };
});

const hasCacheTokens = computed(() => {
  return normalizedUsage.value?.hasCacheInfo || false;
});

const hasDetailedBreakdown = computed(() => {
  return normalizedUsage.value?.hasDetailedInput ||
         normalizedUsage.value?.hasDetailedOutput ||
         false;
});
</script>

<template>
  <div v-if="normalizedUsage" class="token-usage" :class="variant">
    <div v-if="variant === 'default'" class="usage-grid">
      <!-- Input Tokens -->
      <div class="usage-item">
        <div class="usage-label">Input Tokens</div>
        <div class="usage-value">{{ normalizedUsage.prompt.toLocaleString() }}</div>
      </div>

      <!-- Output Tokens -->
      <div class="usage-item">
        <div class="usage-label">Output Tokens</div>
        <div class="usage-value">{{ normalizedUsage.completion.toLocaleString() }}</div>
      </div>

      <!-- Total Tokens -->
      <div class="usage-item total">
        <div class="usage-label">Total Tokens</div>
        <div class="usage-value">{{ normalizedUsage.total.toLocaleString() }}</div>
      </div>

      <!-- Cached Tokens (if any) -->
      <div v-if="normalizedUsage.cached > 0" class="usage-item cache">
        <div class="usage-label">
          <span class="cache-icon">⚡</span> Cache Read
        </div>
        <div class="usage-value">{{ normalizedUsage.cached.toLocaleString() }}</div>
      </div>

      <!-- Cache Write Tokens (if any) -->
      <div v-if="normalizedUsage.cacheWrite > 0" class="usage-item cache-write">
        <div class="usage-label">
          <span class="cache-icon">💾</span> Cache Write
        </div>
        <div class="usage-value">{{ normalizedUsage.cacheWrite.toLocaleString() }}</div>
      </div>

      <!-- Detailed Input Breakdown -->
      <template v-if="normalizedUsage.hasDetailedInput">
        <div v-if="normalizedUsage.promptText > 0" class="usage-item detail">
          <div class="usage-label sub">├─ Text Tokens</div>
          <div class="usage-value sub">{{ normalizedUsage.promptText.toLocaleString() }}</div>
        </div>
        <div v-if="normalizedUsage.promptAudio > 0" class="usage-item detail">
          <div class="usage-label sub">├─ Audio Tokens</div>
          <div class="usage-value sub">{{ normalizedUsage.promptAudio.toLocaleString() }}</div>
        </div>
        <div v-if="normalizedUsage.promptImage > 0" class="usage-item detail">
          <div class="usage-label sub">└─ Image Tokens</div>
          <div class="usage-value sub">{{ normalizedUsage.promptImage.toLocaleString() }}</div>
        </div>
      </template>

      <!-- Detailed Output Breakdown -->
      <template v-if="normalizedUsage.hasDetailedOutput">
        <div v-if="normalizedUsage.completionText > 0" class="usage-item detail">
          <div class="usage-label sub">├─ Text Tokens</div>
          <div class="usage-value sub">{{ normalizedUsage.completionText.toLocaleString() }}</div>
        </div>
        <div v-if="normalizedUsage.completionAudio > 0" class="usage-item detail">
          <div class="usage-label sub">├─ Audio Tokens</div>
          <div class="usage-value sub">{{ normalizedUsage.completionAudio.toLocaleString() }}</div>
        </div>
        <div v-if="normalizedUsage.reasoning > 0" class="usage-item detail reasoning">
          <div class="usage-label sub">└─ Reasoning Tokens</div>
          <div class="usage-value sub">{{ normalizedUsage.reasoning.toLocaleString() }}</div>
        </div>
      </template>
    </div>

    <div v-else class="usage-compact">
      <span class="usage-text">{{ normalizedUsage.prompt.toLocaleString() }} in / {{ normalizedUsage.completion.toLocaleString() }} out</span>
      <span v-if="normalizedUsage.total > 0" class="usage-total">{{ normalizedUsage.total.toLocaleString() }} total</span>
    </div>
  </div>
</template>

<style scoped>
.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.usage-item {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.usage-item.total {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.usage-item.cache {
  background: #f0fdf4;
  border-color: #86efac;
}

.usage-item.cache-write {
  background: #fef3c7;
  border-color: #fcd34d;
}

.usage-item.detail {
  background: #f1f5f9;
  border-color: #cbd5e1;
  padding: 8px 12px;
}

.usage-item.reasoning {
  background: #ede9fe;
  border-color: #c4b5fd;
}

.usage-label {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.usage-label.sub {
  font-size: 1.1rem;
  color: #94a3b8;
}

.cache-icon {
  font-size: 1.1rem;
}

.usage-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
}

.usage-value.sub {
  font-size: 1.4rem;
  font-weight: 600;
  color: #475569;
}

.usage-item.total .usage-value {
  color: #1d4ed8;
}

.usage-item.cache .usage-value {
  color: #15803d;
}

.usage-item.cache-write .usage-value {
  color: #a16207;
}

.usage-item.reasoning .usage-value {
  color: #7c3aed;
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
  font-size: 1.4rem;
  color: #1e293b;
  font-weight: 500;
}

.usage-total {
  font-size: 1.4rem;
  color: #64748b;
  font-weight: 600;
  padding: 2px 6px;
  background: #e2e8f0;
  border-radius: 4px;
}
</style>
