<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  content: string;
  wrapLines?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  wrapLines: true
});

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
</script>

<template>
  <div class="xml-view-container">
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
  white-space: v-bind('wrapLines ? "pre-wrap" : "pre"');
  word-break: v-bind('wrapLines ? "break-all" : "normal"');
  overflow-x: v-bind('wrapLines ? "auto" : "scroll"');
  color: #24292e;
}

:deep(.xv-tag) { color: #22863a; font-weight: 600; }
:deep(.xv-bracket) { color: #6f42c1; }
:deep(.xv-attr-name) { color: #005cc5; }
:deep(.xv-attr-value) { color: #032f62; }
:deep(.xv-equals) { color: #24292e; }
:deep(.xv-comment) { color: #6a737d; font-style: italic; }
</style>
