<script setup lang="ts">
import { computed } from 'vue';
import type { OpenaiTokenUsage } from '@/types/openai/chat-response';

interface Props {
  usage: OpenaiTokenUsage;
}

const props = defineProps<Props>();

const stats = computed(() => {
  const u = props.usage;

  // 1. Normalize Input (Prompt)
  const promptTotal = u.prompt_tokens || u.input_tokens || 0;
  const promptDetails = u.prompt_tokens_details || u.input_tokens_details || {};
  
  // 2. Normalize Output (Completion)
  const completionTotal = u.completion_tokens || u.output_tokens || 0;
  const completionDetails = u.completion_tokens_details || {};

  // 3. Normalize Total
  const total = u.total_tokens || (promptTotal + completionTotal);

  // 4. Claude Specific Cache Writes
  const cacheCreation = (u.claude_cache_creation_5_m_tokens || 0) + (u.claude_cache_creation_1_h_tokens || 0);

  return {
    total,
    prompt: {
      count: promptTotal,
      cached: promptDetails.cached_tokens || 0,
      audio: promptDetails.audio_tokens || 0,
      image: promptDetails.image_tokens || 0,
    },
    completion: {
      count: completionTotal,
      reasoning: completionDetails.reasoning_tokens || 0,
      audio: completionDetails.audio_tokens || 0,
    },
    cacheCreation,
    // Helper to determine if we should show the cache write block
    hasCacheWrite: cacheCreation > 0
  };
});

const formatNum = (num: number) => num.toLocaleString();
</script>

<template>
  <div class="token-usage">
    <!-- Input Section -->
    <div class="card input">
      <div class="header">
        <span class="label">Input</span>
        <span class="value">{{ formatNum(stats.prompt.count) }}</span>
      </div>
      
      <!-- Input Details -->
      <div class="details">
        <div v-if="stats.prompt.cached > 0" class="detail-item cache-hit">
          <span class="dot"></span>
          <span>Cached: {{ formatNum(stats.prompt.cached) }}</span>
        </div>
        <div v-if="stats.prompt.audio > 0" class="detail-item">
          <span class="dot audio"></span>
          <span>Audio: {{ formatNum(stats.prompt.audio) }}</span>
        </div>
        <div v-if="stats.prompt.image > 0" class="detail-item">
          <span class="dot image"></span>
          <span>Image: {{ formatNum(stats.prompt.image) }}</span>
        </div>
      </div>
    </div>

    <!-- Output Section -->
    <div class="card output">
      <div class="header">
        <span class="label">Output</span>
        <span class="value">{{ formatNum(stats.completion.count) }}</span>
      </div>

      <!-- Output Details -->
      <div class="details">
        <div v-if="stats.completion.reasoning > 0" class="detail-item reasoning">
          <span class="dot"></span>
          <span>Reasoning: {{ formatNum(stats.completion.reasoning) }}</span>
        </div>
        <div v-if="stats.completion.audio > 0" class="detail-item">
          <span class="dot audio"></span>
          <span>Audio: {{ formatNum(stats.completion.audio) }}</span>
        </div>
      </div>
    </div>

    <!-- Total Section -->
    <div class="card total">
      <div class="header">
        <span class="label">Total</span>
        <span class="value">{{ formatNum(stats.total) }}</span>
      </div>
      
      <!-- Claude Cache Write (Costly action) -->
      <div v-if="stats.hasCacheWrite" class="details">
         <div class="detail-item cache-write">
          <span class="dot"></span>
          <span>Cache Write: {{ formatNum(stats.cacheCreation) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-usage {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
}

/* Header (Label + Big Number) */
.header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 4px;
}

.label {
  padding: 0;
  font-size: 1.2rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.value {
  font-size: 2.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

/* Details Section (Small sub-stats) */
.details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
  border-top: 1px dashed #f1f5f9;
  padding-top: 6px;
}

.detail-item {
  font-size: 1.75rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Status Dots */
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #94a3b8;
  flex-shrink: 0;
}

/* --- Specific Styling --- */

/* Input / Cached */
.card.input { background: #f8fafc; }
.detail-item.cache-hit { color: #166534; font-weight: 500; }
.detail-item.cache-hit .dot { background-color: #22c55e; }

/* Output / Reasoning */
.card.output { background: #fffcf8; border-color: #fed7aa; }
.detail-item.reasoning { color: #7c3aed; font-weight: 500; }
.detail-item.reasoning .dot { background-color: #8b5cf6; }

/* Total / Cache Write */
.card.total { background: #eff6ff; border-color: #bfdbfe; }
.card.total .value { color: #1d4ed8; }
.detail-item.cache-write { color: #b45309; }
.detail-item.cache-write .dot { background-color: #f59e0b; }

/* Audio / Image Dots */
.dot.audio { background-color: #0ea5e9; }
.dot.image { background-color: #ec4899; }
</style>