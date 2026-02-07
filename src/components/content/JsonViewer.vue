<script setup lang="ts">
import { computed, ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { toast } from 'vue-sonner';

interface Props {
  content: any; // 允许 object, string, number 等
}

const props = defineProps<Props>();

// --- 逻辑: 深度递归解析 JSON ---
const tryParseJSON = (input: any): any => {
  if (typeof input !== 'string') return input;

  try {
    const parsed = JSON.parse(input);
    // 递归检查：如果解出来还是字符串，且像 JSON，继续解
    if (typeof parsed === 'string') {
      const trimmed = parsed.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return tryParseJSON(parsed);
      }
    }
    return parsed;
  } catch (e) {
    return input;
  }
};

const parsedData = computed(() => tryParseJSON(props.content));

const jsonString = computed(() => {
  return JSON.stringify(parsedData.value, null, 2);
});

// --- 逻辑: 语法高亮 ---
const highlightedCode = computed(() => {
  if (!jsonString.value) return '';
  
  // XSS 防护
  let json = jsonString.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'jv-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'jv-key' : 'jv-string';
      } else if (/true|false/.test(match)) {
        cls = 'jv-boolean';
      } else if (/null/.test(match)) {
        cls = 'jv-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
});

// --- 逻辑: 复制 ---
const { copy, isSupported } = useClipboard();
const isCopied = ref(false);

const handleCopy = async () => {
  if (!jsonString.value) return;
  await copy(jsonString.value);
  isCopied.value = true;
  toast.success('JSON copied');
  setTimeout(() => isCopied.value = false, 2000);
};
</script>

<template>
  <div class="json-view-container">
    <button 
      v-if="isSupported" 
      class="copy-btn" 
      :class="{ 'copied': isCopied }"
      @click="handleCopy" 
      type="button"
    >
      <svg v-if="isCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>

    <pre class="json-code" v-html="highlightedCode"></pre>
  </div>
</template>

<style scoped>
.json-view-container {
  position: relative;
  background-color: #fafafa;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.json-code {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  color: #24292e;
}

/* 复制按钮样式 - 鼠标悬停显示 */
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
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.2s, color 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.json-view-container:hover .copy-btn {
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

/* 高亮配色 */
:deep(.jv-key) { color: #795da3; font-weight: 600; }
:deep(.jv-string) { color: #032f62; }
:deep(.jv-number) { color: #005cc5; }
:deep(.jv-boolean) { color: #d73a49; }
:deep(.jv-null) { color: #6a737d; }
</style>