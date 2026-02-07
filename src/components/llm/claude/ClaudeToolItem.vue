<script setup lang="ts">
import { computed } from 'vue';
import type { Tool } from '../../../types/claude/claude-request';
import SmartViewer from '../../content/SmartViewer.vue';

interface Props {
  tool: Tool;
  index: number;
}

const props = defineProps<Props>();

const inputSchemaJson = computed(() => {
  return JSON.stringify(props.tool.input_schema, null, 2);
});

const requiredParams = computed(() => {
  return props.tool.input_schema.required || [];
});

const hasRequired = computed(() => requiredParams.value.length > 0);
</script>

<template>
  <div class="claude-tool-item">
    <div class="tool-header">
      <span class="tool-idx">#{{ index + 1 }}</span>
      <span class="tool-name">{{ tool.name }}</span>
      <span v-if="hasRequired" class="required-badge">
        {{ requiredParams.length }} required
      </span>
    </div>

    <div v-if="tool.description" class="tool-description">
      {{ tool.description }}
    </div>

    <div class="schema-section">
      <div class="schema-header">
        <span class="schema-title">Input Schema</span>
        <span class="schema-type">{{ tool.input_schema.type }}</span>
      </div>
      <SmartViewer :text="inputSchemaJson" />
    </div>
  </div>
</template>

<style scoped>
.claude-tool-item {
  background: var(--llm-bg-elevated);
  border: 1px solid var(--llm-border-light);
  border-radius: var(--llm-radius-lg);
  padding: var(--llm-spacing-md);
  margin-bottom: var(--llm-spacing-md);
}

.claude-tool-item:last-child {
  margin-bottom: 0;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md);
  margin-bottom: var(--llm-spacing-sm);
}

.tool-idx {
  color: var(--llm-text-muted);
  font-size: 1.2rem;
  font-weight: 500;
}

.tool-name {
  font-weight: 600;
  font-size: 1.4rem;
  color: var(--llm-text-primary);
  font-family: var(--llm-font-mono);
}

.required-badge {
  padding: 2px 6px;
  border-radius: var(--llm-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  background: var(--llm-warning-bg, #fef3c7);
  color: var(--llm-warning-text, #92400e);
}

.tool-description {
  color: var(--llm-text-secondary);
  font-size: 1.3rem;
  margin-bottom: var(--llm-spacing-md);
  line-height: 1.5;
}

.schema-section {
  background: var(--llm-bg-content);
  border-radius: var(--llm-radius-md);
  padding: var(--llm-spacing-sm);
}

.schema-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--llm-spacing-sm);
  padding-bottom: var(--llm-spacing-xs);
  border-bottom: 1px solid var(--llm-border-light);
}

.schema-title {
  font-weight: 600;
  font-size: 1.2rem;
  color: var(--llm-text-primary);
}

.schema-type {
  padding: 2px 6px;
  border-radius: var(--llm-radius-sm);
  font-size: 1rem;
  background: var(--llm-tag-bg);
  color: var(--llm-tag-text);
  font-family: var(--llm-font-mono);
}
</style>
