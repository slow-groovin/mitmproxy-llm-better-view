<script setup lang="ts">
import { ref, computed } from 'vue';
import TextBlock from './TextBlock.vue';

interface Props {
  id?: string;
  toolUseId: string;
  content: string | Record<string, unknown>;
  isError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isError: false
});

const isOpen = ref(true);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

const contentString = computed(() => {
  if (typeof props.content === 'string') {
    return props.content;
  }
  return JSON.stringify(props.content, null, 2);
});

const isJson = computed(() => {
  return typeof props.content !== 'string';
});
</script>

<template>
  <div class="tool-result-block" :class="{ error: isError }">
    <div class="tool-result-header" @click="isOpen = !isOpen">
      <span class="tool-result-badge">tool_result</span>
      <span v-if="isError" class="tool-result-error">ERROR</span>
      <span class="tool-result-id">{{ toolUseId.slice(0, 8) }}</span>
      <span class="toggle-icon">{{ toggleIcon }}</span>
    </div>
    <div v-if="isOpen" class="tool-result-content">
      <div v-if="isJson" class="tool-result-json">
        <pre>{{ contentString }}</pre>
      </div>
      <TextBlock
        v-else
        :id="id"
        :text="contentString"
        :is-prose="false"
      />
    </div>
  </div>
</template>

<style scoped>
.tool-result-block {
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f3e8ff;
  background: #faf5ff;
}

.tool-result-block.error {
  border-color: #fecaca;
  background: #fef2f2;
}

.tool-result-header {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3e8ff;
}

.tool-result-block.error .tool-result-header {
  background: #fecaca;
}

.tool-result-header:hover {
  filter: brightness(0.95);
}

.tool-result-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #7c3aed;
  color: white;
}

.tool-result-block.error .tool-result-badge {
  background: #dc2626;
}

.tool-result-error {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #dc2626;
  color: white;
}

.tool-result-id {
  font-size: 1.2rem;
  color: #7c3aed;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tool-result-block.error .tool-result-id {
  color: #dc2626;
}

.toggle-icon {
  margin-left: auto;
  transition: transform 0.2s;
  color: #7c3aed;
  font-size: 1.2000000000000002rem;
}

.tool-result-block.error .toggle-icon {
  color: #dc2626;
}

.tool-result-content {
  padding: 8px;
}

.tool-result-json {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 1.2800000000000002rem;
  overflow-x: auto;
}

.tool-result-json pre {
  margin: 0;
}
</style>
