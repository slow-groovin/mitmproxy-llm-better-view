<script setup lang="ts">
import { computed, useId } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import RoleBadge from '../RoleBadge.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import type { SystemMessage } from '../../../types/claude/claude-request';
import { hashId } from '@/utils/id/hashId';

interface Props {
  message: SystemMessage;
  index: number;
}

const props = defineProps<Props>();

const storageKey = computed(() => `claude-sys-${hashId(JSON.stringify(props.message))}-open`);
const isOpen = useSessionStorage(storageKey, true);

const hasCacheControl = computed(() => {
  return props.message.cache_control?.type === 'ephemeral';
});
</script>

<template>
  <div class="system-message">
    <div class="header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index + 1 }}</span>
        <RoleBadge role="system" />
        <span v-if="hasCacheControl" class="cache-badge" title="Ephemeral cache control">
          cache
        </span>
      </div>
    </div>

    <div v-show="isOpen" class="content">
      <SmartViewer :text="message.text" />
    </div>
  </div>
</template>

<style scoped>
.system-message {
  border-bottom: 1px solid var(--llm-border-light);
  padding: var(--llm-spacing-xs) var(--llm-spacing-md);
  border-left: 3px solid var(--llm-border-system);
}

.system-message:last-child {
  border-bottom: none;
}

.header {
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header:hover {
  background: var(--llm-bg-hover);
  margin: 0 -12px;
  padding: 6px 12px;
  border-radius: var(--llm-radius-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md);
}

.toggle {
  color: var(--llm-text-secondary);
  font-size: 1.2rem;
  transition: transform var(--llm-transition-fast);
}

.index {
  font-size: 1.2rem;
  color: var(--llm-text-muted);
  font-weight: 500;
}

.cache-badge {
  padding: 2px 6px;
  border-radius: var(--llm-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  /* 使用 CSS 变量 */
  background: var(--llm-info-bg);
  color: var(--llm-info-text);
}

.content {
  padding: var(--llm-spacing-sm) var(--llm-spacing-xl);
  background: var(--llm-bg-content);
}
</style>
