<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  id?: string;
  name: string;
  arguments: string | Record<string, unknown>;
  index?: number;
}

const props = withDefaults(defineProps<Props>(), {
  index: 0
});

const isOpen = ref(false);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

const argsString = computed(() => {
  if (typeof props.arguments === 'string') {
    return props.arguments;
  }
  return JSON.stringify(props.arguments, null, 2);
});

const argsPreview = computed(() => {
  if (typeof props.arguments === 'string') {
    return props.arguments.length > 100
      ? props.arguments.slice(0, 100) + '...'
      : props.arguments;
  }
  const keys = Object.keys(props.arguments);
  if (keys.length === 0) return '{}';
  if (keys.length === 1) return `{ ${keys[0]}: ... }`;
  return `{ ${keys.length} keys }`;
});
</script>

<template>
  <div class="tool-call">
    <div class="tool-call-header" @click="isOpen = !isOpen">
      <span class="tool-call-badge">tool_call</span>
      <span class="tool-call-name">{{ name }}</span>
      <span v-if="index !== undefined" class="tool-call-index">#{{ index + 1 }}</span>
      <span v-if="id" class="tool-call-id">{{ id }}</span>
      <span class="toggle-icon">{{ toggleIcon }}</span>
    </div>
    <div v-if="isOpen" class="tool-call-content">
      <pre>{{ argsString }}</pre>
    </div>
    <div v-else class="tool-call-preview">
      {{ argsPreview }}
    </div>
  </div>
</template>

<style scoped>
.tool-call {
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.tool-call-header {
  background: #f8fafc;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  width: 100%;
  text-align: left;
}

.tool-call-header:hover {
  background: #f1f5f9;
}

.tool-call-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1.2rem;
  font-weight: 600;
}

.tool-call-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tool-call-index {
  font-size: 1.2rem;
  color: #94a3b8;
}

.tool-call-id {
  font-size: 1.2rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.toggle-icon {
  margin-left: auto;
  transition: transform 0.2s;
  color: #64748b;
  font-size: 1.2000000000000002rem;
}

.tool-call-content {
  padding: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  font-size: 1.2800000000000002rem;
  overflow-x: auto;
}

.tool-call-content pre {
  margin: 0;
}

.tool-call-preview {
  padding: 8px 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 1.2800000000000002rem;
  color: #64748b;
  background: #f8fafc;
}
</style>
