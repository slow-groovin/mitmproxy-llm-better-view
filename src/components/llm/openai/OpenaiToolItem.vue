<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { hashId } from '../../../utils/id/hashId';
import OpenaiToolParameters from './OpenaiToolParameters.vue';
import ProseContent from '../shared/ProseContent.vue';

// OpenAI tool
interface OpenaiTool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: unknown;
  };
}

interface Props {
  tool: OpenaiTool;
  index: number;
}

const props = defineProps<Props>();

const toolName = computed(() => props.tool.function.name);
const toolDescription = computed(() => props.tool.function.description || '');
const toolParameters = computed(() => props.tool.function.parameters);

// Description preview for header (first 60 chars)
const descriptionPreview = computed(() => {
  const desc = toolDescription.value;
  if (!desc) return '';
  if (desc.length <= 160) return desc;
  return desc.slice(0, 160) + '...';
});

// Generate unique ID for the tool
const toolId = computed(() => `tool-def-${toolName.value}`);

// Generate storage key based on prefix + name + jsonHashId
const storageKey = computed(() => {
  const toolJson = JSON.stringify(props.tool);
  const jsonHashId = hashId(toolJson);
  return `openai-tool-${toolName.value}-${jsonHashId}-open`;
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
  <div :id="toolId" class="openai-tool-item">
    <div class="tool-header" @click="toggle">
      <div class="header-left">
        <span class="toggle-icon">{{ toggleIcon }}</span>
        <span class="tool-index">#{{ index + 1 }}</span>
        <span class="tool-name">{{ toolName }}</span>
        <span v-if="descriptionPreview" class="tool-desc-preview">{{ descriptionPreview }}</span>
      </div>
    </div>

    <div v-if="isOpen" class="tool-content">
      <!-- Raw mode: show entire tool JSON -->
      <div v-if="showRaw" class="raw-mode">
        <div class="raw-header">
          <span class="raw-label">Raw Tool Definition</span>
          <button class="view-formatted-btn" @click="toggleRaw">
            ▶ View Formatted
          </button>
        </div>
        <pre class="raw-content">{{ JSON.stringify(tool, null, 2) }}</pre>
      </div>

      <!-- Formatted mode -->
      <template v-else>
        <div class="formatted-header">
          <button class="view-raw-btn" @click="toggleRaw">
            ▶ View Raw
          </button>
        </div>

        <!-- Description with markdown rendering (collapsible) -->
        <div v-if="toolDescription" class="description-section">
          <details open class="description-details">
            <summary class="description-summary">
              <span class="section-label-inline">Description</span>
            </summary>
            <div class="description-content">
              <ProseContent :content="toolDescription" />
            </div>
          </details>
        </div>

        <!-- Parameters section with OpenaiToolParameters -->
        <div v-if="toolParameters" class="parameters-section">
          <div class="section-label">Parameters</div>
          <OpenaiToolParameters :parameters="toolParameters" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.openai-tool-item {
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
  max-width: 100%;
  align-items: center;
  gap: 10px;
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
  max-width: 70%;
}

.tool-content {
  padding: 6px 6px 6px 16px ;
  border-top: 1px solid #e2e8f0;
}

/* Raw mode styles */
.raw-mode {
  margin:  0;
}

.raw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.raw-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.raw-content {
  background: #f8fafc;
  color: #1e293b;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 1.3rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Formatted mode styles */
.formatted-header {
  display: flex;
  justify-content: flex-end;
}

.view-raw-btn,
.view-formatted-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s;
}

.view-raw-btn:hover,
.view-formatted-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
}

/* Section styles */
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

/* Collapsible Description Styles - Minimal, matches Parameters */
.description-details {
  border: none;
  background: transparent;
}

.description-summary {
  padding: 0 0 8px 0;
  cursor: pointer;
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
}

.description-summary::-webkit-details-marker {
  display: none;
}

.description-summary::before {
  content: '▼';
  font-size: 1rem;
  color: #64748b;
  margin-right: 8px;
  transition: transform 0.2s;
}

.description-details:not([open]) .description-summary::before {
  transform: rotate(-90deg);
}

.section-label-inline {
  font-size: 1.2rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.description-content {
  padding: 0;
  background: transparent;
  border: none;
}
</style>
