<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  id?: string;
  name: string;
  args: Record<string, unknown>;
  thoughtSignature?: string;
}

const props = defineProps<Props>();

const isOpen = ref(true);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

const argsJson = computed(() => {
  return JSON.stringify(props.args, null, 2);
});

const argsSummary = computed(() => {
  const keys = Object.keys(props.args);
  if (keys.length === 0) return '{}';
  if (keys.length === 1) return `{ ${keys[0]}: ... }`;
  return `{ ${keys.length} keys }`;
});
</script>

<template>
  <div class="function-call-block">
    <div class="function-call-header" @click="isOpen = !isOpen">
      <span class="function-call-badge">function_call</span>
      <span class="function-call-name">{{ name }}</span>
      <span v-if="thoughtSignature" class="function-call-signature" :title="thoughtSignature">
        ✓ thought
      </span>
      <span class="toggle-icon">{{ toggleIcon }}</span>
    </div>
    <div v-if="isOpen" class="function-call-content">
      <div class="function-call-args">
        <pre>{{ argsJson }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.function-call-block {
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f3e8ff;
  background: #faf5ff;
}

.function-call-header {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3e8ff;
}

.function-call-header:hover {
  background: #e9d5ff;
}

.function-call-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #7c3aed;
  color: white;
}

.function-call-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.function-call-signature {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  background: #fef3c7;
  color: #92400e;
}

.toggle-icon {
  margin-left: auto;
  transition: transform 0.2s;
  color: #7c3aed;
  font-size: 1.2000000000000002rem;
}

.function-call-content {
  padding: 8px;
}

.function-call-args {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 1.2800000000000002rem;
  overflow-x: auto;
}

.function-call-args pre {
  margin: 0;
}
</style>
