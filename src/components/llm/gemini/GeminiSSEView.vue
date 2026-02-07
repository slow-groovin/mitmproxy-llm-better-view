<script setup lang="ts">
import type { ParsedSSEChunk } from '@/types/gemini/sse';

interface Props {
  chunks: ParsedSSEChunk[];
}

defineProps<Props>();
</script>

<template>
  <div class="gemini-sse-view">
    <pre class="placeholder">{{ JSON.stringify(chunks, null, 2) }}</pre>
  </div>
</template>

<style scoped>
.gemini-sse-view {
  padding: 2px;
}

.placeholder {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #f8fafc;
  color: #1e293b;
  padding: 12px;
  border-radius: 6px;
  font-size: 1.2rem;
  white-space: pre-wrap;
  overflow-x: auto;
}
</style>
