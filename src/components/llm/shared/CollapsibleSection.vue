<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  title: string;
  defaultOpen?: boolean;
  count?: number | null;
  icon?: string;
  variant?: 'default' | 'tools';
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: true,
  count: null,
  icon: '',
  variant: 'default'
});

const isOpen = ref(props.defaultOpen);

const toggleClass = computed(() => ({
  'tools': props.variant === 'tools'
}));

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');
</script>

<template>
  <div class="section">
    <div class="section-header" @click="isOpen = !isOpen">
      <div class="section-title">
        {{ title }}
        <span v-if="count !== null" class="section-count">({{ count }})</span>
      </div>
      <div class="section-controls">
        <button class="expand-collapse-btn" :class="toggleClass" @click.stop="isOpen = !isOpen">
          <span class="toggle-icon">{{ toggleIcon }}</span>
        </button>
      </div>
    </div>
    <div v-if="isOpen" class="section-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.section:last-child {
  border-bottom: none;
}

.section-header {
  padding: 10px 12px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.section-header:hover {
  background: #e2e8f0;
}

.section-title {
  font-weight: 600;
  font-size: 2rem;
  color: #1e293b;
}

.section-count {
  color: #64748b;
  font-size: 0.85rem;
  margin-left: 4px;
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-collapse-btn {
  background: #dbeafe;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 2px;
  transition: background-color 0.2s;
}

.expand-collapse-btn:hover {
  background: #bfdbfe;
}

.expand-collapse-btn.tools {
  background: #f3e8ff;
  color: #7c3aed;
}

.expand-collapse-btn.tools:hover {
  background: #e9d5ff;
}

.toggle-icon {
  transition: transform 0.2s;
  color: #64748b;
  font-size: 0.75rem;
}

.section-content {
  padding: 2px;
}
</style>
