<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { ref } from 'vue';

interface Props {
  title: string;
  defaultOpen?: boolean;
  count?: number | null;
  /**
   * 用于 LocalStorage 持久化的唯一键。
   * 如果传入此值，展开状态将被保存。
   */
  storageKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: false,
  count: null,
  storageKey: undefined
});

// 状态管理逻辑
// 如果提供了 storageKey，使用 useStorage (持久化)
// 否则使用普通的 ref (非持久化)
const isOpen = props.storageKey
  ? useStorage(`llm-better-view-collapse-state-${props.storageKey}`, props.defaultOpen)
  : ref(props.defaultOpen);

const toggle = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <div class="collapse-card" :class="{ 'is-open': isOpen }">
    <!-- 头部区域 -->
    <button class="card-header" @click="toggle" type="button">
      <div class="header-left">
        <span class="title">{{ title }}</span>
        <span v-if="count !== null" class="badge">{{ count }}</span>
      </div>
      
      <div class="header-right">
        <!-- 使用 SVG 替换原有字符图标，并添加旋转类 -->
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
      </div>
    </button>

    <!-- 内容区域：使用 CSS Grid 技巧实现高度平滑过渡 -->
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
/* 容器基础样式 */
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

/* 头部样式 */
.card-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
  outline: none;
}

.card-header:hover {
  background-color: #f8fafc;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 标题样式 - 更加现代和适中的字号 */
.title {
  font-size: 2rem;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.01em;
}


.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* 核心样式：浅蓝背景 + 深蓝文字 */
  background-color: #dbeafe; 
  color: #1e40af;
  
  font-size: 1.5rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px; /*稍微方一点的圆角，更数字化 */
  margin-left: 8px;
}

/* 图标样式与旋转动画 */
.chevron-icon {
  color: #94a3b8;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s;
}

.collapse-card.is-open .chevron-icon {
  transform: rotate(180deg);
  color: #475569;
}

/* 
  内容区域动画核心技巧 
  使用 grid-template-rows 从 0fr 到 1fr 过渡，
  这是目前纯 CSS 实现 height: auto 动画的最佳方案。
*/
.card-content-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-card.is-open .card-content-wrapper {
  grid-template-rows: 1fr;
  border-top: 1px solid #f1f5f9; /* 展开时添加一条极细的分隔线 */
}

.card-content-inner {
  overflow: hidden;
}

.content-padding {
  padding: 0.5rem;
  color: #334155;
  font-size: 1rem;
}
</style>