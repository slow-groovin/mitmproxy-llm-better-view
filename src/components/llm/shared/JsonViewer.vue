<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

interface Props {
  data: unknown;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxDepth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: false,
  defaultExpanded: true,
  maxDepth: 10
});

const isExpanded = ref(props.defaultExpanded);
const jsonContent = ref('');
const isLarge = ref(false);

onMounted(() => {
  try {
    jsonContent.value = JSON.stringify(props.data, null, 2);
    isLarge.value = jsonContent.value.length > 5000;
  } catch (e) {
    jsonContent.value = String(props.data);
  }
});

const truncatedContent = computed(() => {
  if (isLarge.value && !isExpanded.value) {
    return jsonContent.value.slice(0, 500) + '\n... (truncated)';
  }
  return jsonContent.value;
});
</script>

<template>
  <div class="json-viewer">
    <div v-if="collapsible && isLarge" class="json-header" @click="isExpanded = !isExpanded">
      <span class="json-toggle">{{ isExpanded ? '▼' : '▶' }}</span>
      <span class="json-label">JSON Data</span>
    </div>
    <div class="json-content">
      <pre>{{ truncatedContent }}</pre>
    </div>
  </div>
</template>

<style scoped>
.json-viewer {
  font-family: 'Monaco', 'Menlo', monospace;
}

.json-header {
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #1e293b;
}

.json-header:hover {
  background: #f1f5f9;
}

.json-toggle {
  transition: transform 0.2s;
}

.json-label {
  font-weight: 600;
}

.json-content {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  white-space: pre-wrap;
  overflow-x: auto;
}

.json-content pre {
  margin: 0;
  font-family: inherit;
}
</style>
