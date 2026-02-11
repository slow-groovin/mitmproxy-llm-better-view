<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import { hashId } from '@/utils/id/hashId';

type BadgeType = 'text' | 'image' | 'tool' | 'thinking' | 'system';

interface Props {
  id?: string;
  index: string;
  badgeType: BadgeType;
  badgeText: string;
  storagePrefix?: string;
  defaultOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  storagePrefix: 'sub-msg',
  defaultOpen: true,
});

const storageKey = computed(() => {
  const keyId = props.id || hashId(`${props.index}-${props.badgeText}`);
  return `${props.storagePrefix}-${keyId}-open`;
});

const isOpen = useSessionStorage(storageKey, props.defaultOpen);
const badgeClass = computed(() => `badge-${props.badgeType}`);
</script>

<template>
  <div class="sub-message-item">
    <div class="header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index }}</span>
        <span class="badge" :class="badgeClass">{{ badgeText }}</span>
        <slot name="header" />

      </div>
    </div>

    <div v-show="isOpen" class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sub-message-item {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
}

.header {
  padding: 4px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header:hover {
  background: var(--llm-bg-hover, rgba(148, 163, 184, 0.08));
  margin: 0 -8px;
  padding: 4px 8px;
  border-radius: var(--llm-radius-sm, 4px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-sm, 8px);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-sm, 8px);
}

.toggle {
  color: var(--llm-text-secondary, #64748b);
  font-size: 1.1rem;
  transition: transform var(--llm-transition-fast, 0.2s);
}

.index {
  font-size: 1.2rem;
  color: var(--llm-text-secondary, #64748b);
  font-weight: 500;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--llm-radius-sm, 4px);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge-text {
  background: var(--llm-badge-text-bg, color-mix(in srgb, #10b981 25%, transparent));
  color: var(--llm-badge-text-text, #10b981);
}

.badge-image {
  background: var(--llm-badge-image-bg, color-mix(in srgb, #3b82f6 25%, transparent));
  color: var(--llm-badge-image-text, #3b82f6);
}

.badge-tool {
  background: var(--llm-badge-tool-bg, color-mix(in srgb, #8b5cf6 25%, transparent));
  color: var(--llm-badge-tool-text, #8b5cf6);
}

.badge-thinking {
  background: var(--llm-badge-thinking-bg, color-mix(in srgb, #afafafac 35%, transparent));
  color: var(--llm-badge-thinking-text, #4b5563);
}

.badge-system {
  background: var(--llm-badge-system-bg, color-mix(in srgb, #f59e0b 25%, transparent));
  color: var(--llm-badge-system-text, #f59e0b);
}

.content {
  padding: var(--llm-spacing-sm, 8px) 0 var(--llm-spacing-sm, 8px) var(--llm-spacing-md, 12px);
  background: transparent;
}
</style>