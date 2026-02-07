<script setup lang="ts">
import type { SSEEvent } from '@/types/claude/claude-sse';

interface Props {
  events: SSEEvent[];
}

defineProps<Props>();
</script>

<template>
  <div class="claude-sse-view">
    <pre class="placeholder">{{ JSON.stringify(events, null, 2) }}</pre>
  </div>
</template>

<style scoped>
.claude-sse-view {
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
