<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { hashId } from '@/utils/id/hashId';
import type { FunctionDeclaration } from '@/types/gemini/request';
import SmartViewer from '@/components/content/SmartViewer.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';

interface Props {
  tool: FunctionDeclaration;
  index: number;
}

const props = defineProps<Props>();

const toolName = computed(() => props.tool.name);
const toolDescription = computed(() => props.tool.description || '');
const toolParameters = computed(() => props.tool.parameters);

// Description preview for header (first 160 chars)
const descriptionPreview = computed(() => {
  const desc = toolDescription.value;
  if (!desc) return '';
  if (desc.length <= 160) return desc;
  return desc.slice(0, 160) + '...';
});

// Generate unique ID for the tool
const toolId = computed(() => `gemini-tool-def-${toolName.value}`);

// Generate storage key based on prefix + name + jsonHashId
const storageKey = computed(() => {
  const toolJson = JSON.stringify(props.tool);
  const jsonHashId = hashId(toolJson);
  return `gemini-tool-${toolName.value}-${jsonHashId}-open`;
});

// Use useStorage for persistent state
const isOpen = useStorage(storageKey.value, true);

// Toggle open/close
const toggle = () => {
  isOpen.value = !isOpen.value;
};

// View raw toggle - shows entire tool JSON
const showRaw = ref(false);
const toggleRaw = () => {
  showRaw.value = !showRaw.value;
};

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');
</script>

<template>
  <div :id="toolId" class="gemini-tool-item">
    <!-- Collapsible Header -->
    <div class="tool-header" @click="toggle">
      <div class="header-left">
        <span class="toggle-icon">{{ toggleIcon }}</span>
        <span class="tool-index">#{{ index + 1 }}</span>
        <span class="tool-name">{{ toolName }}</span>
        <span v-if="descriptionPreview" class="tool-desc-preview">{{ descriptionPreview }}</span>
      </div>
      <!-- View Raw outline button - header 右侧 -->
      <button
        v-if="isOpen"
        class="raw-btn header-right"
        :class="{ active: showRaw }"
        @click.stop="toggleRaw"
      >
        {{ 'View Raw' }}
      </button>
    </div>

    <!-- Expandable Content -->
    <div v-if="isOpen" class="tool-content">
      <!-- Raw mode: show entire tool JSON -->
      <div v-if="showRaw" class="raw-mode">
        <SmartViewer :text="JSON.stringify(tool, null, 2)"/>
      </div>

      <!-- Formatted mode -->
      <template v-else>
        <!-- Description with markdown rendering (collapsible) -->
        <div v-if="toolDescription" class="description-section">
          <BetterDetails default-open>
            <template #summary>
              <div class="section-label" style="margin-bottom: -2px;">DESCRIPTION</div>
            </template>
            <SmartViewer :text="toolDescription" />
          </BetterDetails>
        </div>

        <!-- Parameters section -->
        <div v-if="toolParameters" class="parameters-section">
          <div class="section-label">Input Schema</div>
          <SmartViewer :text="JSON.stringify(toolParameters, null, 2)" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.gemini-tool-item {
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
  gap: 10px;
}

.header-right{
  flex-shrink: 0;
}

.toggle-icon {
  color: #64748b;
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.tool-index {
  font-size: 1.3rem;
  color: #94a3b8;
  font-weight: 500;
  min-width: 28px;
}

.tool-name {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 1.4rem;
  font-weight: 600;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 4px 10px;
  border-radius: 4px;
  flex-shrink: 0;
}

.tool-desc-preview {
  font-size: 1.3rem;
  color: #64748b;
  font-style: italic;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80%;
}

/* View Raw outline button - header 右侧 */
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

/* Raw mode styles */
.raw-mode {
  margin: 0;
}

/* Section styles - 无左侧 border */
.description-section,
.parameters-section {
  margin-bottom: 16px;
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
