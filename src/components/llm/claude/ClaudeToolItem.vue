<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { hashId } from '../../../utils/id/hashId';
import type { Tool } from '../../../types/claude/claude-request';
import ClaudeToolParameters from './ClaudeToolParameters.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '@/components/content/SmartViewer.vue';

interface Props {
  tool: Tool;
  index: number;
}

const props = defineProps<Props>();

const toolName = computed(() => props.tool.name);
const toolDescription = computed(() => props.tool.description || '');
const toolSchema = computed(() => props.tool.input_schema);

// Description preview for header (first 160 chars)
const descriptionPreview = computed(() => {
  const desc = toolDescription.value;
  if (!desc) return '';
  if (desc.length <= 160) return desc;
  return desc.slice(0, 160) + '...';
});

// Generate unique ID for the tool
const toolId = computed(() => `claude-tool-def-${toolName.value}`);

// Generate storage key based on prefix + name + jsonHashId
const storageKey = computed(() => {
  const toolJson = JSON.stringify(props.tool);
  const jsonHashId = hashId(toolJson);
  return `claude-tool-${toolName.value}-${jsonHashId}-open`;
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
  <div :id="toolId" class="claude-tool-item">
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

        <!-- Parameters section with ClaudeToolParameters -->
        <div v-if="toolSchema" class="parameters-section">
          <div class="section-label">Input Schema</div>
          <ClaudeToolParameters :schema="toolSchema" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.claude-tool-item {
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
  flex: 1;          /* 占据剩余空间 */
  min-width: 0;    /* 关键！允许内容收缩 */
  align-items: center;
  gap: 10px;
}

.header-right{
  flex-shrink: 0;  /* 不被挤压 */
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

/* Section styles - 添加左侧padding以区分父子层级 */
.description-section,
.parameters-section {
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 2px solid #e2e8f0;
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
