<script setup lang="ts">
import { computed, inject, ref, Ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import SmartViewer from '@/components/content/SmartViewer.vue';
import ToolParameters from './ToolParameters.vue';

interface Props {
  name: string;
  description?: string;
  params?: unknown;
  index: number;
  standard: 'claude' | 'openai' | 'gemini';
}

const props = defineProps<Props>();

const storageKey = computed(() => {
  return `tool-${props.standard}-${props.name}-open`;
});

const isOpen = useStorage(storageKey.value, true);
const toggle = () => { isOpen.value = !isOpen.value; };

const showRaw = ref(false);
const toggleRaw = () => { showRaw.value = !showRaw.value; };

// 监听 CollapsibleSection 提供的批量折叠状态
const bulkCollapseState = inject<Ref<'collapsed' | 'expanded' | null>>('bulkCollapseState');

// 监听批量折叠状态变化，同步更新本地状态
watch(
  () => bulkCollapseState?.value,
  (newState) => {
    if (newState === 'expanded') {
      isOpen.value = true;
    } else if (newState === 'collapsed') {
      isOpen.value = false;
    }
  },
  { immediate: false }
);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');
const descPreview = computed(() => {
  if (!props.description) return '';
  return props.description.length > 160
    ? props.description.slice(0, 160) + '...'
    : props.description;
});
</script>

<template>
  <div :id="`${standard}-tool-${name}`" class="tool-item">
    <div class="tool-header" @click="toggle">
      <div class="header-left">
        <span class="toggle-icon">{{ toggleIcon }}</span>
        <span class="tool-index">#{{ index + 1 }}</span>
        <span class="tool-name">{{ name }}</span>
        <span v-if="descPreview" class="tool-desc-preview">{{ descPreview }}</span>
      </div>
      <button
        v-if="isOpen"
        class="raw-btn"
        :class="{ active: showRaw }"
        @click.stop="toggleRaw"
      >
        View Raw
      </button>
    </div>

    <div v-if="isOpen" class="tool-content">
      <div v-if="showRaw" class="raw-mode">
        <SmartViewer :text="JSON.stringify({ name, description, params }, null, 2)" />
      </div>

      <template v-else>
        <div v-if="description" class="description-section">
          <div class="section-label">DESCRIPTION</div>
          <SmartViewer :text="description" />
        </div>

        <div v-if="params" class="parameters-section">
          <div class="section-label">PARAMETERS</div>
          <ToolParameters :schema="params" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tool-item {
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tool-header:hover {
  background: #f1f5f9;
}

.header-left {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.header-right {
  flex-shrink: 0;
}

.toggle-icon {
  color: #64748b;
  font-size: 1.2rem;
}

.tool-index {
  font-size: 1.3rem;
  color: #94a3b8;
  font-weight: 500;
}

.tool-name {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 1.4rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  flex-shrink: 0;
  background: #f3e8ff;
  color: #7c3aed;
}

.tool-desc-preview {
  font-size: 1.3rem;
  color: #64748b;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.raw-btn {
  padding: 4px 10px;
  font-size: 1.1rem;
  color: #64748b;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.raw-btn:hover {
  color: #374151;
  border-color: #9ca3af;
}

.raw-btn.active {
  color: #3b82f6;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.tool-content {
  padding: 6px 6px 6px 16px;
  border-top: 1px solid #e2e8f0;
}

.raw-mode {
  margin: 0;
}

.description-section,
.parameters-section {
  margin-bottom: 16px;
  padding-left: 1rem;
}

.description-section:last-child,
.parameters-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
</style>