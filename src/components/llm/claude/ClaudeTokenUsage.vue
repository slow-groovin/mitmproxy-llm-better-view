<script setup lang="ts">
import { computed } from 'vue';
import type { Usage } from '../../../types/claude/claude-response';

interface Props {
  usage: Usage;
}

const props = defineProps<Props>();

const stats = computed(() => {
  const u = props.usage;

  // Input tokens
  const inputTokens = u.input_tokens || 0;
  const cacheReadTokens = u.cache_read_input_tokens || 0;
  const cacheCreationTokens = u.cache_creation_input_tokens || 0;

  // Output tokens
  const outputTokens = u.output_tokens || 0;

  // Total tokens
  const totalTokens = inputTokens + outputTokens;

  // Calculate cache read percentage
  const cacheReadPercent = inputTokens > 0 ? Math.round((cacheReadTokens / inputTokens) * 100) : 0;

  return {
    input: {
      count: inputTokens,
      cacheRead: cacheReadTokens,
      cacheCreation: cacheCreationTokens,
      cacheReadPercent
    },
    output: {
      count: outputTokens
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
        <div v-if="stats.input.cacheRead > 0" class="detail-item cache-hit">
          <span class="dot"></span>
          <span>Cache Read: {{ formatNum(stats.input.cacheRead) }} ({{ formatPercent(stats.input.cacheReadPercent) }})</span>
        </div>
        <div v-if="stats.input.cacheCreation > 0" class="detail-item cache-write">
          <span class="dot"></span>
          <span>Cache Write: {{ formatNum(stats.input.cacheCreation) }}</span>
        </div>
      </div>
    </div>

    <!-- Output Section -->
    <div class="card output">
      <div class="header">
        <span class="label">Output</span>
        <span class="value">{{ formatNum(stats.output.count) }}</span>
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

.detail-item.cache-write { color: #b45309; font-weight: 500; }
.detail-item.cache-write .dot { background-color: #f59e0b; }

/* Output */
.card.output { background: #fffcf8; border-color: #fed7aa; }

/* Total */
.card.total { background: #eff6ff; border-color: #bfdbfe; }
.card.total .value { color: #1d4ed8; }
</style>
