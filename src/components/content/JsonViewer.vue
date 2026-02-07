<script setup lang="ts">
import { computed } from 'vue';

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
</script>

<template>
  <div class="json-view-container">
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

/* 高亮配色 */
:deep(.jv-key) { color: #795da3; font-weight: 600; }
:deep(.jv-string) { color: #032f62; }
:deep(.jv-number) { color: #005cc5; }
:deep(.jv-boolean) { color: #d73a49; }
:deep(.jv-null) { color: #6a737d; }
</style>
