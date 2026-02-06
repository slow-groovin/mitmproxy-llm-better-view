<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  data: unknown;
  title?: string;
  defaultOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'JSON',
  defaultOpen: false
});

const jsonText = computed(() => {
  try {
    return JSON.stringify(props.data, null, 2);
  } catch {
    return String(props.data);
  }
});
</script>

<template>
  <details :open="defaultOpen">
    <summary>{{ title }}</summary>
    <pre>{{ jsonText }}</pre>
  </details>
</template>

<style scoped>
/* 刻意几乎不加样式，只做最小可读性保障 */
pre {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
