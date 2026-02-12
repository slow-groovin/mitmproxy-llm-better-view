<script setup lang="ts">
import { computed } from 'vue';
import type { ResponseContentBlock, ResponseTextBlock, ResponseThinkingBlock, ResponseToolUseBlock } from '@/types/claude/claude-response';
import SmartViewer from '@/components/content/SmartViewer.vue';
import ToolArgs from '@/components/llm/ToolArgs.vue';

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

// Get block type label for badge display
const blockTypeLabel = computed(() => {
  if (isTextBlock(props.block)) return 'TEXT';
  if (isToolUseBlock(props.block)) return 'TOOL';
  if (isThinkingBlock(props.block)) return 'THINK';
  return 'UNKNOWN';
});

// Get block type class for container styling
const blockTypeClass = computed(() => {
  if (isTextBlock(props.block)) return 'type-text';
  if (isToolUseBlock(props.block)) return 'type-tool-use';
  if (isThinkingBlock(props.block)) return 'type-thinking';
  return 'type-unknown';
});

// Get badge type class for badge background/text colors
const badgeTypeClass = computed(() => {
  if (isTextBlock(props.block)) return 'badge-text';
  if (isToolUseBlock(props.block)) return 'badge-tool-use';
  if (isThinkingBlock(props.block)) return 'badge-thinking';
  return 'badge-unknown';
});


</script>

<template>
  <div class="content-block" :class="blockTypeClass">
    <!-- Block Header - Compact style like OpenaiToolItem -->
    <div class="block-header" >
      <div class="header-left">
        <span class="block-type-badge" :class="badgeTypeClass">{{ blockTypeLabel }}</span>
        <span class="block-index">#{{ index + 1 }}</span>
        <span class="block-name">{{ (props.block as any)?.name }}</span>
      </div>
    </div>

    <!-- Block Content (collapsible) -->
    <div class="">
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
          <ToolArgs :input="block.input" />
        
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
  margin-left: 8px;
  overflow: hidden;
}

.content-block:last-child {
  margin-bottom: 0;
}

/* Block Header - Compact style like OpenaiToolItem */
.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.2s;
}



.header-left {
  display: flex;
  max-width: 100%;
  align-items: center;
}


.block-index {
  font-size: 1.3rem;
  color: #94a3b8;
  font-weight: 500;
}

.block-type-badge {
  font-size: 1rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.block-name {
  font-family: var(--llm-font-mono);
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--llm-badge-tool-use-text);
  background: var(--llm-badge-tool-use-bg);
  padding: 4px 10px;
  border-radius: 4px;
  flex-shrink: 0;
}




.type-unknown {
  border-left: 3px solid #9ca3af;
}

/* Badge-specific background and text colors */
.badge-text {
  background: var(--llm-badge-assistant-bg);
  color: var(--llm-badge-assistant-text);
}

.badge-tool-use {
  background: var(--llm-badge-tool-bg);
  color: var(--llm-badge-tool-text);
}

.badge-thinking {
  background: var(--llm-badge-thinking-bg);
  color: var(--llm-badge-thinking-text);
}

.badge-unknown {
  background: #f3f4f6;
  color: #4b5563;
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
  border-left: 3px solid var(--llm-border-thinking);
  border-radius: 0 6px 6px 0;
  padding: 8px 12px;
  font-style: italic;
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