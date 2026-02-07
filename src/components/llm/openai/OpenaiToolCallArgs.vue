<script setup lang="ts">
import JsonViewer from '../../content/JsonViewer.vue';

interface Props {
  arguments: string | object;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="tool-args">
    <JsonViewer 
      :content="arguments" 
      title="Tool Arguments"
      default-open
    />
  </div>
</template>

<style scoped>
.tool-args {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 1.28rem;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
