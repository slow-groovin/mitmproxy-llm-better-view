<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { ref, watch } from 'vue';

interface Props {
  title: string;
  defaultOpen?: boolean;
  count?: number | null;
  storageKey?: string;
  /** 外部强制控制展开状态 */
  forceOpen?: boolean | null;
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: false,
  count: null,
  storageKey: undefined,
  forceOpen: null
});

const isOpen = props.storageKey
  ? useStorage(`llm-better-view-collapse-state-${props.storageKey}`, props.defaultOpen)
  : ref(props.defaultOpen);

// 监听外部强制控制
watch(() => props.forceOpen, (newVal) => {
  if (newVal !== null && newVal !== undefined) {
    isOpen.value = newVal;
  }
});

const toggle = () => {
  isOpen.value = !isOpen.value;
};

// 暴露方法供父组件使用
const ensureOpen = () => {
  if (!isOpen.value) {
    isOpen.value = true;
  }
};

defineExpose({
  isOpen,
  toggle,
  ensureOpen
});
</script>

<template>
  <div class="collapse-card" :class="{ 'is-open': isOpen }">
    <button class="card-header" @click="toggle" type="button">
      <div class="header-left">
        <span class="title">{{ title }}</span>
        <span v-if="count !== null" class="badge">{{ count }}</span>
      </div>

      <div style="flex-grow: 1;"/>
      <!-- 右侧插槽，用于放置自定义按钮等 -->
      <div class="header-right" @click.stop>
        <slot name="header-right" />
      </div>

      <svg 
        class="chevron-icon" 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <div class="card-content-wrapper">
      <div class="card-content-inner">
        <div class="content-padding">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collapse-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  overflow: hidden;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.collapse-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-header {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  /* 使用CSS变量: 50%透明度的主色 */
  background: color-mix(in srgb, var(--llm-subject-color, #e2e8f0) 20%, transparent);
  border: none;
  border-bottom: 1px solid #cbd5e1;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
  outline: none;
}

.card-header:hover {
  /* hover时: 70%透明度的主色 */
  background: color-mix(in srgb, var(--llm-subject-color, #ffffff) 30%, transparent);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
}

.title {
  font-size: 2rem; /* 保持原尺寸 */
  font-weight: 600;
  color: #1e293b;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #dbeafe; 
  color: #1e40af;
  font-size: 1.5rem; /* 保持原尺寸 */
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

.chevron-icon {
  color: #64748b;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s;
}

.collapse-card.is-open .chevron-icon {
  transform: rotate(180deg);
  color: #475569;
}

.card-content-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-card.is-open .card-content-wrapper {
  grid-template-rows: 1fr;
}

.card-content-inner {
  overflow: hidden;
}


.content-padding {
  padding: 2px;
}
</style>