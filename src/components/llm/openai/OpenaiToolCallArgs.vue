<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  arguments: string | object;
}

const props = defineProps<Props>();

const parsedArgs = computed(() => {
  try {
    // 如果已经是对象,直接返回
    if (typeof props.arguments === 'object') {
      return props.arguments;
    }
    
    // 尝试解析字符串
    return JSON.parse(props.arguments);
  } catch {
    // 解析失败,返回原始值
    return props.arguments;
  }
});

const formattedJson = computed(() => {
  try {
    return JSON.stringify(parsedArgs.value, null, 2);
  } catch {
    return String(props.arguments);
  }
});

const isValidJson = computed(() => {
  return typeof parsedArgs.value === 'object';
});
</script>

<template>
  <div class="tool-args">
    <pre v-if="isValidJson" class="json">{{ formattedJson }}</pre>
    <pre v-else class="raw">{{ arguments }}</pre>
  </div>
</template>

<style scoped>
.tool-args {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 1.28rem;
  border-radius: 4px;
  overflow-x: auto;
}

.json,
.raw {
  margin: 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.json {
  color: #1e293b;
}

.raw {
  color: #dc2626;
  font-style: italic;
}
</style>