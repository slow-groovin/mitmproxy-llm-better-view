<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  id?: string;
  thinking: string;
  signature?: string;
}

const props = defineProps<Props>();

const isOpen = ref(false);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

const lines = computed(() => {
  return props.thinking.split('\n').length;
});

const preview = computed(() => {
  if (props.thinking.length <= 200) {
    return props.thinking;
  }
  return props.thinking.slice(0, 200) + '...';
});
</script>

<template>
  <div class="thinking-block">
    <div class="thinking-header" @click="isOpen = !isOpen">
      <span class="thinking-badge">thinking</span>
      <span class="thinking-lines">{{ lines }} lines</span>
      <span v-if="signature" class="thinking-signature" :title="signature">
        ✓ signed
      </span>
      <span class="toggle-icon">{{ toggleIcon }}</span>
    </div>
    <div v-if="isOpen" class="thinking-content">
      <pre>{{ thinking }}</pre>
    </div>
    <div v-else class="thinking-preview">
      {{ preview }}
    </div>
  </div>
</template>

<style scoped>
.thinking-block {
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #fef3c7;
  background: #fffbeb;
}

.thinking-header {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef3c7;
}

.thinking-header:hover {
  background: #fde68a;
}

.thinking-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #d97706;
  color: white;
}

.thinking-lines {
  font-size: 0.75rem;
  color: #92400e;
}

.thinking-signature {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  background: #dcfce7;
  color: #166534;
}

.toggle-icon {
  margin-left: auto;
  transition: transform 0.2s;
  color: #92400e;
  font-size: 0.75rem;
}

.thinking-content {
  padding: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  font-size: 0.85rem;
  white-space: pre-wrap;
  line-height: 1.6;
  overflow-x: auto;
}

.thinking-content pre {
  margin: 0;
}

.thinking-preview {
  padding: 8px 12px;
  color: #78350f;
  font-style: italic;
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>
