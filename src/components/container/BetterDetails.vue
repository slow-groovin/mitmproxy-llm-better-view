<script setup lang="ts">
interface Props {
  title?: string;
  defaultOpen?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: 'Details',
  defaultOpen: false
});
</script>

<template>
  <details class="native-details" :open="defaultOpen">
    <summary class="native-summary">{{ title }}</summary>
    <div class="details-content">
      <slot />
    </div>
  </details>
</template>

<style scoped>
/* 
 * 使用 revert 关键字尽可能还原浏览器默认样式 
 * 或者手动指定回默认值以覆盖全局样式
 */

.native-details {
  display: block;
  background-color: transparent;
  color: inherit;
  border: none;
  margin: 0;
  padding: 0;
}

.native-summary {
  /* 强制恢复 summary 的默认显示模式 */
  display: list-item; 
  cursor: pointer;
  background-color: transparent;
  color: inherit; /* 跟随父级字体颜色 */
  font-weight: normal;
  outline: none;
  padding: 4px 0; /* 稍微给点上下间距，但不给背景 */
  user-select: none;
  
  /* 恢复列表样式（小三角） */
  list-style: disclosure-closed; 
  list-style-type: disclosure-closed;
  list-style-position: inside;
}

/* 针对 Webkit 内核 (Chrome/Safari) 强制显示原生小三角 */
.native-summary::-webkit-details-marker {
  display: list-item;
  color: inherit;
}

/* 展开状态下的小三角方向 */
.native-details[open] > .native-summary {
  list-style: disclosure-open;
  list-style-type: disclosure-open;
  margin-bottom: 4px; /* 展开后给内容留点空隙 */
}

.details-content {
  /* 内容区域缩进，符合原生视觉习惯 */
  /* padding-left: 16px; */
}
</style>