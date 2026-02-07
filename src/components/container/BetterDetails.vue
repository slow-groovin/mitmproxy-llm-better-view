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
.native-details {
  display: block;
  /* 确保盒模型为 border-box，防止 padding 撑大容器 */
  box-sizing: border-box; 
  background-color: transparent;
  color: inherit;
  border: none;
  margin: 0;
  padding: 0;
  /* 限制宽度不超过父容器 */
  max-width: 100%; 
}

.native-summary {
  display: list-item;
  box-sizing: border-box; /* 关键：确保 padding 和 border 不会增加宽度 */
  cursor: pointer;
  background-color: transparent;
  color: inherit;
  font-weight: normal;
  outline: none;
  padding: 4px 0;
  user-select: none;
  width: 100%; /* 显式声明宽度 */
  
  /* 
   * 修复建议：
   * 原生默认其实是 outside。使用 inside 虽然方便对齐，
   * 但会把小三角算作文本的一部分，容易造成折行或宽度计算问题。
   * 这里保留 inside 以维持你原有的设计意图，但依靠 box-sizing 修复溢出。
   */
  list-style: disclosure-closed inside;
}

/* 
 * 【重要修复】
 * 删除了 display: list-item; 
 * 只需要保留颜色继承即可。给伪元素加 display: list-item 会破坏布局导致宽度溢出。
 */
.native-summary::-webkit-details-marker {
  color: inherit;
}

/* 展开状态样式 */
.native-details[open] > .native-summary {
  list-style-type: disclosure-open;
  margin-bottom: 4px;
}

.details-content {
  box-sizing: border-box;
  max-width: 100%;
  /* 防止内容溢出撑开父容器 */
  overflow-wrap: break-word; 
}
</style>