<script setup lang="ts">
import { computed, inject, Ref, watch } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import { hashId } from '@/utils/id/hashId';
import RoleBadge from './RoleBadge.vue';
import SmartViewer from '../content/SmartViewer.vue';

interface Props {
  id?: string;
  index: string;
  role: string;
  count?: number;
  dataAsText?: string;
  storagePrefix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  dataAsText: '',
  storagePrefix: 'msg',
});

// 统一生成keyId
const keyId = computed(() =>
  props.id || hashId(props.dataAsText || `${props.index}-${props.role}`)
);

const isOpen = useSessionStorage(() => `${props.storagePrefix}-${keyId.value}-open`, true);
const isRawView = useSessionStorage(() => `${props.storagePrefix}-${keyId.value}-raw`, false);

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

const toggleRawView = (e: MouseEvent) => {
  e.stopPropagation();
  isRawView.value = !isRawView.value;
};
</script>

<template>
  <div class="message-item" :class="`role-${role.toLowerCase()}`">
    <div class="header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index }}</span>
        <RoleBadge :role="role" />
        <span v-if="count > 0" class="count-badge">{{ count }}</span>
      </div>

      <button
        v-if="dataAsText && isOpen"
        class="raw-btn"
        :class="{ active: isRawView }"
        @click="toggleRawView"
      >
        View Raw
      </button>
    </div>

    <div v-show="isOpen" class="content">
      <SmartViewer v-if="isRawView" :text="dataAsText"></SmartViewer>
      <slot v-else />
    </div>
  </div>
</template>

<style scoped>
.message-item {
  border-bottom: 2px solid var(--llm-message-border, rgba(126, 180, 233, 0.31));
  padding: var(--llm-spacing-xs, 4px) var(--llm-spacing-md, 12px);
  margin: var(--llm-spacing-sm, 8px) 0;
}

.message-item:last-child {
  border-bottom: none;
}

/* 角色边框 */
.role-system { border-left: 3px solid var(--llm-border-system, #8b5cf6); }
.role-user { border-left: 3px solid var(--llm-border-user, #3b82f6); }
.role-assistant { border-left: 3px solid var(--llm-border-assistant, #10b981); }
.role-tool { border-left: 3px solid var(--llm-border-tool, #f59e0b); }
.role-model { border-left: 3px solid var(--llm-border-model, #ec4899); }
.role-function { border-left: 3px solid var(--llm-border-function, #6b7280); }

.header {
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header:hover {
  /* background: var(--llm-subject-color, rgb(255, 255, 255)); */
  background: color-mix(in srgb, var(--llm-subject-color, #929aa56a) 15%, #4ef19da0 10%);
  margin: 0 -12px;
  padding: 6px 12px;
  border-radius: var(--llm-radius-md, 6px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md, 12px);
}

.toggle {
  color: var(--llm-text-secondary, #64748b);
  font-size: 1.2rem;
  transition: transform var(--llm-transition-fast, 0.2s);
}

.index {
  font-size: 1.2rem;
  color: var(--llm-text-muted, #94a3b8);
  font-weight: 500;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* min-width: 20px; */
  /* height: 20px; */
  padding: 0 3px;
  border: 1px solid var(--llm-border-color, #cbd5e1);
  border-radius: 6px;
  
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--llm-text-muted, #94a3b8);
}

.raw-btn {
  padding: 4px 10px;
  font-size: 1.1rem;
  color: var(--llm-text-secondary, #64748b);
  background: transparent;
  border: 1px solid var(--llm-border-color, #cbd5e1);
  border-radius: var(--llm-radius-lg, 8px);
  cursor: pointer;
  transition: all var(--llm-transition-fast, 0.2s);
}

.raw-btn:hover {
  color: var(--llm-text-primary, #334155);
  border-color: var(--llm-border-dark, #94a3b8);
}

.raw-btn.active {
  color: var(--llm-btn-active-text, #2563eb);
  border-color: var(--llm-btn-active-border, #2563eb);
  background: var(--llm-btn-active-bg, rgba(37, 99, 235, 0.1));
}

.content {
  padding: var(--llm-spacing-sm) var(--llm-spacing-md);
  background: var(--llm-bg-content, rgba(248, 250, 252, 0.5));
}
</style>