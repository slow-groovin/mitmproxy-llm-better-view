<script setup lang="ts">
import { computed } from 'vue';
import type { ResponseContentBlock, ResponseTextBlock, ResponseToolUseBlock, ResponseThinkingBlock } from '../../../types/claude/claude-response';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import ClaudeToolUseArgs from './ClaudeToolUseArgs.vue';

interface Props {
  block: ResponseContentBlock;
  index: number;
}

const props = defineProps<Props>();

// Type guards
const isTextBlock = (block: ResponseContentBlock): block is ResponseTextBlock => {
  return block.type === 'text';
};

const isToolUseBlock = (block: ResponseContentBlock): block is ResponseToolUseBlock => {
  return block.type === 'tool_use';
};

const isThinkingBlock = (block: ResponseContentBlock): block is ResponseThinkingBlock => {
  return block.type === 'thinking';
};

// Get block type label for display
const blockTypeLabel = computed(() => {
  if (isTextBlock(props.block)) return 'TEXT';
  if (isToolUseBlock(props.block)) return 'TOOL USE';
  if (isThinkingBlock(props.block)) return 'THINKING';
  return 'UNKNOWN';
});

// Get block type class for styling
const blockTypeClass = computed(() => {
  if (isTextBlock(props.block)) return 'type-text';
  if (isToolUseBlock(props.block)) return 'type-tool-use';
  if (isThinkingBlock(props.block)) return 'type-thinking';
  return 'type-unknown';
});
</script>

<template>
  <div class="content-block" :class="blockTypeClass">
    <!-- Block Header -->
    <div class="block-header">
      <span class="block-index">#{{ index + 1 }}</span>
      <span class="block-type-badge" :class="blockTypeClass">{{ blockTypeLabel }}</span>
      <span v-if="isToolUseBlock(block)" class="tool-name">{{ block.name }}</span>
    </div>

    <!-- Block Content -->
    <div class="block-content">
      <!-- Text Block -->
      <template v-if="isTextBlock(block)">
        <SmartViewer :text="block.text" />
        <div v-if="block.citations && block.citations.length > 0" class="citations-section">
          <div class="citations-label">Citations ({{ block.citations.length }})</div>
          <div v-for="(citation, idx) in block.citations" :key="idx" class="citation-item">
            <span class="citation-range">[{{ citation.start }}-{{ citation.end }}]</span>
            <span class="citation-type">{{ citation.document.type }}</span>
          </div>
        </div>
      </template>

      <!-- Tool Use Block -->
      <template v-else-if="isToolUseBlock(block)">
        <BetterDetails default-open>
          <template #summary>
            <div class="tool-summary">
              <span class="tool-id">ID: {{ block.id }}</span>
            </div>
          </template>
          <ClaudeToolUseArgs :input="block.input" />
        </BetterDetails>
      </template>

      <!-- Thinking Block -->
      <template v-else-if="isThinkingBlock(block)">
        <div class="thinking-content">
          <SmartViewer :text="block.thinking" />
        </div>
      </template>

      <!-- Unknown Block -->
      <template v-else>
        <div class="unknown-block">
          <SmartViewer :text="JSON.stringify(block, null, 2)" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.content-block {
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.content-block:last-child {
  margin-bottom: 0;
}

/* Block Header */
.block-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.block-index {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: 500;
  min-width: 28px;
}

.block-type-badge {
  font-size: 1rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Type-specific badge colors */
.type-text {
  background: #dbeafe;
  color: #1e40af;
}

.type-tool-use {
  background: #f3e8ff;
  color: #7c3aed;
}

.type-thinking {
  background: #f5f3ff;
  color: #6d28d9;
}

.type-unknown {
  background: #f3f4f6;
  color: #4b5563;
}

.tool-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 1.3rem;
  color: #7c3aed;
  font-weight: 600;
}

/* Block Content */
.block-content {
  padding: 12px;
}

/* Tool Summary */
.tool-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 1.1rem;
  color: #6b7280;
}

/* Thinking Content */
.thinking-content {
  border-left: 3px solid #8b5cf6;
  background: #f5f3ff;
  border-radius: 0 6px 6px 0;
  padding: 8px 12px;
}

/* Citations Section */
.citations-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.citations-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.citation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 1.2rem;
}

.citation-range {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #2563eb;
  font-weight: 500;
}

.citation-type {
  color: #6b7280;
  text-transform: capitalize;
}

/* Unknown Block */
.unknown-block {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
}

/* Empty State */
.empty-state {
  text-align: center;
  color: var(--llm-text-secondary);
  font-style: italic;
  padding: 40px 20px;
}
</style>
