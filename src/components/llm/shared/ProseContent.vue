<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { marked } from 'marked';
import type { ContentFormat } from '../../../utils/format/formatContent';
import { detectContentFormat, formatContent } from '../../../utils/format/formatContent';

interface Props {
  content: string;
  format?: ContentFormat;
  maxLines?: number;
  isCollapsible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxLines: undefined,
  isCollapsible: false
});

const isExpanded = ref(true);
const htmlContent = ref('');
const detectedFormat = ref<ContentFormat>('text');
const lineCount = ref(0);

onMounted(() => {
  detectedFormat.value = props.format || detectContentFormat(props.content);

  // Count lines
  lineCount.value = props.content.split('\n').length;

  // Render content based on format
  const format = detectedFormat.value;
  const formatted = formatContent(props.content, format);

  if (format === 'json') {
    htmlContent.value = `<pre class="json-pre">${escapeHtml(formatted)}</pre>`;
  } else if (format === 'xml') {
    htmlContent.value = `<pre class="xml-pre">${escapeHtml(formatted)}</pre>`;
  } else {
    // Markdown or text
    const renderer = {
      html({ text }: { text: string }) {
        return `<div class="markdown-html">${escapeHtml(text)}</div>`;
      }
    };
    htmlContent.value = marked.parse(formatted, { renderer }) as string;
  }
});

const shouldCollapse = computed(() => {
  return props.isCollapsible && props.maxLines && lineCount.value > props.maxLines;
});

const displayContent = computed(() => {
  if (!shouldCollapse.value || isExpanded.value) {
    return htmlContent.value;
  }
  // Truncate content (simplified - in real implementation, count rendered lines)
  return htmlContent.value;
});

const toggleText = computed(() => {
  return isExpanded.value ? 'Show less' : `Show all (${lineCount.value} lines)`;
});

function escapeHtml(text: string): string {
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
  <div class="prose-content">
    <div v-if="shouldCollapse" class="prose-toggle" @click="toggle">
      {{ toggleText }}
    </div>
    <div class="prose" :class="detectedFormat" v-html="displayContent"></div>
  </div>
</template>

<style scoped>
.prose-content {
  position: relative;
}

.prose-toggle {
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #1d4ed8;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.prose-toggle:hover {
  background: #f1f5f9;
}

.prose {
  line-height: 1.7;
  color: #374151;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2937;
}

.prose h1 {
  font-size: 1.25em;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: 4px;
}

.prose h2 {
  font-size: 1.1em;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: 4px;
}

.prose h3 {
  font-size: 1em;
}

.prose h4 {
  font-size: 0.9rem;
}

.prose h5 {
  font-size: 0.85em;
}

.prose h6 {
  font-size: 0.8em;
  color: #656d76;
}

.prose p {
  margin-top: 0;
  margin-bottom: 1em;
}

.prose ul,
.prose ol {
  margin-top: 0;
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.prose li {
  margin-bottom: 0.25em;
}

.prose blockquote {
  margin: 8px 0;
  padding: 0 12px;
  color: #656d76;
  border-left: 3px solid #d0d7de;
}

.prose code {
  background: #f3f4f6;
  padding: 0.125em 0.25em;
  border-radius: 0.25em;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.prose pre {
  background: #1f2937;
  color: #f9fafb;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #d0d7de;
}

.prose pre code {
  background: none;
  padding: 0;
}

.prose a {
  color: #0969da;
  text-decoration: none;
}

.prose a:hover {
  text-decoration: underline;
}

.prose strong {
  font-weight: 600;
}

.prose em {
  font-style: italic;
}

.prose table {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

.prose th,
.prose td {
  border: 1px solid #d0d7de;
  padding: 6px 8px;
  text-align: left;
}

.prose th {
  background: #f6f8fa;
  font-weight: 600;
}

.prose.json-pre,
.prose.xml-pre {
  background: #1f2937;
  color: #e2e8f0;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  white-space: pre-wrap;
}

.prose.markdown-html {
  white-space: pre;
  font-family: 'Monaco', 'Menlo', monospace;
  overflow-x: auto;
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
}
</style>
