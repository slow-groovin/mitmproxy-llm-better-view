<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

interface Props {
  content: string;
  wrapLines?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  wrapLines: true
});

// Define emit for v-model support
defineEmits<{
  'update:content': [value: string];
}>();

// 响应式生成 HTML 内容
const htmlContent = computed(() => {
  if (!props.content) return '';

  try {
    // 实例化 Renderer (marked 现代版本的标准做法)
    const renderer = new marked.Renderer();
    
    // 直接解析 Markdown
    return marked.parse(props.content, { 
      renderer,
      async: false, // 确保同步返回字符串
      breaks: true,  // 支持回车换行
      gfm: true      // 启用 GitHub 风格的 Markdown
    }) as string;
  } catch (e) {
    console.error('Markdown parsing error:', e);
    return props.content;
  }
});
</script>

<template>
  <div class="prose-wrapper">
    <div class="prose" v-html="htmlContent"></div>
  </div>
</template>

<style scoped>
/* 容器设置 */
.prose-wrapper {
  width: 100%;
  overflow: hidden;
}

.prose {
  /* 基准字体 15px */
  font-size: 1.5rem; 
  line-height: 1.75;
  color: #374151;
  word-wrap: break-word;
}

/* 使用 :deep() 确保样式能作用于 v-html 生成的内容 */

:deep(h1), :deep(h2), :deep(h3), :deep(h4) {
  color: #111827;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
}

:deep(h1) { font-size: 1.75em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
:deep(h2) { font-size: 1.5em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
:deep(h3) { font-size: 1.25em; }

:deep(p) {
  margin-bottom: 0.25em;
}

/* 列表样式
:deep(ul), :deep(ol) {
  margin-bottom: 1.25em;
  padding-left: 1.5em;
} */

/* :deep(li) {
  margin-bottom: 0.5em;
} */

/* 代码样式 */
:deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
  background-color: #f1f5f9;
  color: #ef4444; /* 经典行内代码配色 */
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

:deep(pre) {
  background: #1e293b;
  color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: v-bind('wrapLines ? "auto" : "scroll"');
  white-space: v-bind('wrapLines ? "pre-wrap" : "pre"');
  margin: 1.5em 0;
}

:deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

/* 引用 */
:deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  color: #6b7280;
  font-style: italic;
  margin: 1.5em 0;
}

/* 图片 */
:deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

/* 表格 */
:deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5em;
}

:deep(th), :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.6em;
  text-align: left;
}

:deep(th) {
  background: #f9fafb;
}
</style>