<script setup lang="ts">
import { computed } from 'vue';
import type { UsageMetadata } from '@/types/gemini/common';

interface Props {
  usage: UsageMetadata;
}

const props = defineProps<Props>();

const stats = computed(() => {
  const u = props.usage;

  // Input tokens (prompt)
  const inputTokens = u.promptTokenCount || 0;
  const cachedTokens = u.cachedContentTokenCount || 0;

  // Calculate cached percentage
  const cachedPercent = inputTokens > 0 ? Math.round((cachedTokens / inputTokens) * 100) : 0;

  // Output tokens (candidates)
  const outputTokens = u.candidatesTokenCount || 0;

  // Reasoning/thinking tokens
  const reasoningTokens = u.thoughtsTokenCount || 0;

  // Total tokens
  const totalTokens = u.totalTokenCount || (inputTokens + outputTokens);

  return {
    input: {
      count: inputTokens,
      cached: cachedTokens,
      cachedPercent
    },
    output: {
      count: outputTokens,
      reasoning: reasoningTokens
    },
    total: totalTokens
  };
});

const formatNum = (num: number) => num.toLocaleString();
const formatPercent = (percent: number) => `${percent}%`;
</script>

<template>
  <div class="token-usage">
    <!-- Input Section -->
    <div class="card input">
      <div class="header">
        <span class="label">Input</span>
        <span class="value">{{ formatNum(stats.input.count) }}</span>
      </div>

      <!-- Input Details -->
      <div class="details">
        <div v-if="stats.input.cached > 0" class="detail-item cache-hit">
          <span class="dot"></span>
          <span>Cached: {{ formatNum(stats.input.cached) }} ({{ formatPercent(stats.input.cachedPercent) }})</span>
        </div>
      </div>
    </div>

    <!-- Output Section -->
    <div class="card output">
      <div class="header">
        <span class="label">Output</span>
        <span class="value">{{ formatNum(stats.output.count) }}</span>
      </div>

      <!-- Output Details -->
      <div class="details">
        <div v-if="stats.output.reasoning > 0" class="detail-item reasoning">
          <span class="dot"></span>
          <span>Reasoning: {{ formatNum(stats.output.reasoning) }}</span>
        </div>
      </div>
    </div>

    <!-- Total Section -->
    <div class="card total">
      <div class="header">
        <span class="label">Total</span>
        <span class="value">{{ formatNum(stats.total) }}</span>
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

/* Total */
.card.total { background: #eff6ff; border-color: #bfdbfe; }
.card.total .value { color: #1d4ed8; }
</style>
