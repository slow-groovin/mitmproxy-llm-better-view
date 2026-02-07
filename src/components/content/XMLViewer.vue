<script setup lang="ts">
import { computed, ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { toast } from 'vue-sonner';

interface Props {
  content: string;
}

const props = defineProps<Props>();

// 语法高亮
const highlightedXML = computed(() => {
  let xml = props.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return xml
    // 标签
    .replace(/(&lt;\/?)([\w-:]+)(.*?)(&gt;)/g, (_, open, tag, attrs, close) => {
      const highlightedAttrs = attrs.replace(
        /([\w-:]+)(=)(".*?"|'.*?')/g,
        '<span class="xv-attr-name">$1</span><span class="xv-equals">$2</span><span class="xv-attr-value">$3</span>'
      );
      return `<span class="xv-bracket">${open}</span><span class="xv-tag">${tag}</span>${highlightedAttrs}<span class="xv-bracket">${close}</span>`;
    })
    // 注释
    .replace(/(&lt;!--)(.*?)(--&gt;)/g, '<span class="xv-comment">$1$2$3</span>');
});

// 复制
const { copy, isSupported } = useClipboard();
const isCopied = ref(false);

const handleCopy = async () => {
  await copy(props.content);
  isCopied.value = true;
  toast.success('XML copied');
  setTimeout(() => isCopied.value = false, 2000);
};
</script>

<template>
  <div class="xml-view-container">
    <button 
      v-if="isSupported" 
      class="copy-btn" 
      :class="{ 'copied': isCopied }"
      @click="handleCopy"
    >
      <svg v-if="isCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>

    <pre class="xml-code" v-html="highlightedXML"></pre>
  </div>
</template>

<style scoped>
.xml-view-container {
  position: relative;
  background-color: #fafafa;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.xml-code {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  color: #24292e;
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.xml-view-container:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.copy-btn.copied {
  opacity: 1;
  border-color: #10b981;
  color: #10b981;
  background-color: #ecfdf5;
}

:deep(.xv-tag) { color: #22863a; font-weight: 600; }
:deep(.xv-bracket) { color: #6f42c1; }
:deep(.xv-attr-name) { color: #005cc5; }
:deep(.xv-attr-value) { color: #032f62; }
:deep(.xv-equals) { color: #24292e; }
:deep(.xv-comment) { color: #6a737d; font-style: italic; }
</style>