<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  id?: string;
  name: string;
  input: Record<string, unknown>;
}

const props = defineProps<Props>();

const isOpen = ref(true);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

const inputJson = computed(() => {
  return JSON.stringify(props.input, null, 2);
});

const inputSummary = computed(() => {
  const keys = Object.keys(props.input);
  if (keys.length === 0) return '{}';
  if (keys.length === 1) return `{ ${keys[0]}: ... }`;
  return `{ ${keys.length} keys }`;
});
</script>

<template>
  <div class="tool-use-block">
    <div class="tool-use-header" @click="isOpen = !isOpen">
      <span class="tool-use-badge">tool_use</span>
      <span class="tool-use-name">{{ name }}</span>
      <span v-if="id" class="tool-use-id">{{ id.slice(0, 8) }}</span>
      <span class="toggle-icon">{{ toggleIcon }}</span>
    </div>
    <div v-if="isOpen" class="tool-use-content">
      <div class="tool-use-input">
        <pre>{{ inputJson }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-use-block {
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f3e8ff;
  background: #faf5ff;
}

.tool-use-header {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3e8ff;
}

.tool-use-header:hover {
  background: #e9d5ff;
}

.tool-use-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #7c3aed;
  color: white;
}

.tool-use-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tool-use-id {
  font-size: 1.2rem;
  color: #7c3aed;
  font-family: 'Monaco', 'Menlo', monospace;
}

.toggle-icon {
  margin-left: auto;
  transition: transform 0.2s;
  color: #7c3aed;
  font-size: 1.2000000000000002rem;
}

.tool-use-content {
  padding: 8px;
}

.tool-use-input {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 1.2800000000000002rem;
  overflow-x: auto;
}

.tool-use-input pre {
  margin: 0;
}
</style>
