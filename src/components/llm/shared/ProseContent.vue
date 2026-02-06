<script setup lang="ts">
import { computed, ref } from 'vue';
import { marked } from 'marked';
import type { ContentFormat } from '../../../utils/format/formatContent';
import { detectContentFormat, formatContent } from '../../../utils/format/formatContent';

interface Props {
  content: string;
  format?: ContentFormat;
  maxHeight?: number; // 改为最大高度，比行数控制更准确
  isCollapsible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: 300, // 默认折叠高度 300px
  isCollapsible: false
});

const isExpanded = ref(false);

// 1. 响应式处理格式检测
const detectedFormat = computed(() => {
  return props.format || detectContentFormat(props.content);
});

// 2. 响应式生成 HTML 内容
const htmlContent = computed(() => {
  if (!props.content) return '';

  const format = detectedFormat.value;
  const formatted = formatContent(props.content, format);

  if (format === 'json') {
    return `<pre class="json-pre">${escapeHtml(formatted)}</pre>`;
  } else if (format === 'xml') {
    return `<pre class="xml-pre">${escapeHtml(formatted)}</pre>`;
  } else {
    // Markdown or text
    // 修复报错的关键：实例化 Renderer 类，而不是传递普通对象
    const renderer = new marked.Renderer();
    
    // 覆盖 html 方法：将原本会被解析的 HTML 标签转义显示
    renderer.html = ( text : { text: string } | string) => {
      // 兼容不同版本的 marked 参数
      const content = typeof text === 'object' ? (text as any).text : text; 
      return `<div class="markdown-html">${escapeHtml(content || '')}</div>`;
    };

    try {
      return marked.parse(formatted, { renderer }) as string;
    } catch (e) {
      console.error('Markdown parsing error:', e);
      return `<pre>${escapeHtml(formatted)}</pre>`;
    }
  }
});

// 计算是否需要显示“展开/收起”按钮
// 注意：这只是基于是否允许折叠的逻辑判断，实际高度溢出判断通常需要 DOM 操作
// 这里简化为：只要开启折叠且内容较长（简单通过字符数预估）就显示
const showToggle = computed(() => {
  return props.isCollapsible && props.content.length > 200;
});

const toggleText = computed(() => {
  return isExpanded.value ? '收起' : '展开查看全部';
});

// 简单的 HTML 转义工具函数
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toggle() {
  isExpanded.value = !isExpanded.value;
}
</script>

<template>
  <div class="prose-wrapper">
    <!-- 内容区域 -->
    <div 
      class="prose-container"
      :class="{ 
        'is-collapsed': props.isCollapsible && !isExpanded,
        [detectedFormat]: true 
      }"
      :style="props.isCollapsible && !isExpanded ? { maxHeight: `${props.maxHeight}px` } : {}"
    >
      <div class="prose" v-html="htmlContent"></div>
      
      <!-- 遮罩层 (仅在折叠状态显示) -->
      <div v-if="showToggle && !isExpanded" class="collapse-mask"></div>
    </div>

    <!-- 切换按钮 -->
    <div v-if="showToggle" class="toggle-btn-wrapper">
      <button class="prose-toggle" @click="toggle">
        {{ toggleText }}
      </button>
    </div>
  </div>
</template>
<style scoped>
/* =========================================
   布局容器与折叠逻辑
   ========================================= */
.prose-wrapper {
  position: relative;
  width: 100%;
  /* 防止内部 margin 溢出 */
  overflow: hidden; 
}

.prose-container {
  position: relative;
  transition: max-height 0.3s ease;
  overflow: hidden;
}

/* 折叠遮罩：白色渐变 */
.collapse-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 80px; /* 稍微加高一点，过渡更自然 */
  background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1) 80%);
  pointer-events: none;
  z-index: 10;
}

.toggle-btn-wrapper {
  margin-top: 12px;
  text-align: center;
  position: relative;
  z-index: 11;
}

.prose-toggle {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px; /* 胶囊形状更现代 */
  cursor: pointer;
  /* 1.4rem = 14px，适合按钮文字 */
  font-size: 1.4rem; 
  line-height: 1.5;
  color: #2563eb;
  font-weight: 500;
  transition: all 0.2s ease;
  outline: none;
}

.prose-toggle:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

/* =========================================
   Prose 正文排版 (Markdown 样式重置)
   ========================================= */
.prose {
  /* 核心：基于 10px 根字体，设置正文为 1.5rem (15px) */
  font-size: 1.5rem; 
  line-height: 1.75;
  color: #374151; /* 灰色-700 */
  word-wrap: break-word;
}

/* 
  使用 :deep() 穿透 v-html 内容 
  强制重置所有标题大小，避免继承巨大的全局样式
*/

/* H1: 1.75em * 15px ≈ 26px */
:deep(.prose h1) {
  font-size: 1.75em;
  margin-top: 0; /* 第一个元素去除上边距 */
  margin-bottom: 0.8em;
  font-weight: 700;
  line-height: 1.3;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

/* H2: 1.5em * 15px ≈ 22.5px */
:deep(.prose h2) {
  font-size: 1.5em;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  font-weight: 600;
  line-height: 1.35;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

/* H3: 1.25em * 15px ≈ 19px */
:deep(.prose h3) {
  font-size: 1.25em;
  margin-top: 1.4em;
  margin-bottom: 0.6em;
  font-weight: 600;
  line-height: 1.5;
  color: #1f2937;
}

/* H4: 1.1em * 15px ≈ 16.5px */
:deep(.prose h4) {
  font-size: 1.1em;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: #1f2937;
}

/* H5 & H6: 与正文同大或略小 */
:deep(.prose h5) {
  font-size: 1em;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: #1f2937;
}

:deep(.prose h6) {
  font-size: 0.875em;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
}

/* 段落与列表 */
:deep(.prose p) {
  margin-top: 0;
  margin-bottom: 1.25em;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 0;
  margin-bottom: 1.25em;
  padding-left: 1.6em; /* 缩进 */
}

:deep(.prose li) {
  margin-bottom: 0.4em;
}

/* 引用块 */
:deep(.prose blockquote) {
  font-style: italic;
  color: #4b5563;
  border-left: 4px solid #e5e7eb;
  margin: 1.5em 0;
  padding-left: 1em;
  background: transparent;
}

/* =========================================
   代码与特殊格式样式
   ========================================= */

/* 行内代码 code */
:deep(.prose code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  /* 0.875em * 15px ≈ 13px */
  font-size: 0.875em; 
  background-color: #f1f5f9;
  color: #0f172a;
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

/* 代码块 pre */
:deep(.prose pre) {
  background: #1e293b; /* 深色背景 */
  color: #e2e8f0;
  padding: 1.2em;
  border-radius: 8px;
  overflow-x: auto;
  margin-top: 0;
  margin-bottom: 1.5em;
  line-height: 1.6;
}

:deep(.prose pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
  font-size: 0.9em; /* 代码块字体稍微调小一点，约 13.5px */
}

/* JSON / XML 特殊类 */
:deep(.json-pre),
:deep(.xml-pre) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.4rem; /* 14px */
  white-space: pre-wrap;
  background: #1e293b;
  color: #e2e8f0;
  padding: 1.2em;
  border-radius: 8px;
  margin: 0;
  overflow-x: auto;
}

/* Markdown HTML 占位符 */
:deep(.markdown-html) {
  background: #f1f5f9;
  padding: 8px 12px;
  border-radius: 6px;
  display: block; /* 改为块级显示，避免排版混乱 */
  font-family: monospace;
  font-size: 1.3rem; /* 13px */
  color: #64748b;
  margin-bottom: 1em;
  border: 1px dashed #cbd5e1;
}

/* 图片 */
:deep(.prose img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

/* 表格 */
:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5em;
  font-size: 0.95em;
}

:deep(.prose th),
:deep(.prose td) {
  border: 1px solid #e2e8f0;
  padding: 0.75em;
  text-align: left;
}

:deep(.prose th) {
  background-color: #f8fafc;
  font-weight: 600;
}

/* 链接 */
:deep(.prose a) {
  color: #2563eb;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

:deep(.prose a:hover) {
  border-bottom-color: #2563eb;
}
</style>