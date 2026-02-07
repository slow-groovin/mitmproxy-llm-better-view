<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  content: string;
  wrapLines?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  wrapLines: true
});

const whiteSpace = computed(() => props.wrapLines ? 'pre-wrap' : 'pre');
</script>

<template>
  <pre
    class="raw-viewer"
    :style="{ whiteSpace }"
  >{{ content }}</pre>
</template>

<style scoped>
.raw-viewer {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 0;
}
</style>
