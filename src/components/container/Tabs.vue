<script setup lang="ts">
import { shallowRef, watch, type Component } from 'vue';
import { useStorage } from '@vueuse/core';
import { CONSTANTS } from '@/lib/constant';

interface TabItem {
  name: string;
  component: Component;
}

const props = defineProps<{
  tabs: TabItem[];
}>();

const STORAGE_KEY = `${CONSTANTS.prefix}debug-active-tab`;

// 保存当前激活的标签页索引
const activeIndex = useStorage(STORAGE_KEY, 0, localStorage, { listenToStorageChanges: false });

// 使用 shallowRef 避免深度响应式
const ActiveComponent = shallowRef<Component | null>(props.tabs[0]?.component || null);

// 监听索引变化，更新当前组件
watch(activeIndex, (newIndex) => {
  const tab = props.tabs[newIndex];
  if (tab) {
    ActiveComponent.value = tab.component;
  }
}, { immediate: true });
</script>

<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        :class="['tab-button', { active: activeIndex === index }]"
        @click="activeIndex = index"
      >
        {{ tab.name }}
      </button>
    </div>
    <div class="tabs-content">
      <component :is="ActiveComponent" v-if="ActiveComponent" />
    </div>
  </div>
</template>

<style scoped>
.tabs-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs-header {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid #444;
}

.tab-button {
  padding: 8px 16px;
  background: #444;
  color: #ccc;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #555;
}

.tab-button.active {
  background: #667eea;
  color: white;
}

.tabs-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
