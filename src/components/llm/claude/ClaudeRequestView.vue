<script setup lang="ts">
import type { ClaudeRequest } from '@/types/claude/claude-request';

interface Props {
  data: ClaudeRequest;
}

defineProps<Props>();
</script>

<template>
  <div class="claude-request-view">
    <pre class="placeholder">{{ JSON.stringify(data, null, 2) }}</pre>
  </div>
</template>

<style scoped>
.claude-request-view {
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
