<script setup lang="ts">
import { useSlots } from 'vue';

interface Props {
  title?: string;
  defaultOpen?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: 'Details',
  defaultOpen: false
});

const slots = useSlots();
</script>

<template>
  <details class="native-details" :open="defaultOpen">
    <summary class="native-summary">
      <span class="summary-content">
        <slot v-if="slots.summary" name="summary" />
        <template v-else>{{ title }}</template>
      </span>
    </summary>
    
    <div class="details-content">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.native-details {
  display: block;
  box-sizing: border-box; 
  width: 100%;
}

.native-summary {
  display: list-item;
  list-style: disclosure-closed inside;
  cursor: pointer;
  outline: none;
  padding: 4px 0;
  user-select: none;
  
  /* 添加这行 */
  align-items: center;
}

/* 解决换行的核心样式 */
.summary-content {
  /* 使用 inline-flex 可以让插槽内的 div 或其它组件强行保持在同一行 */
  display: inline-flex;
  align-items: center;
  gap: 8px; /* 箭头和文字之间的间距 */
  
  /* 确保不换行 */
  white-space: nowrap; 
  /* vertical-align: middle; */
}

/* 展开状态 */
.native-details[open] > .native-summary {
  list-style-type: disclosure-open;
}

/* 兼容处理：隐藏部分浏览器可能出现的双箭头或默认样式 */
.native-summary::-webkit-details-marker {
  color: inherit;
}

.details-content {
}
</style>