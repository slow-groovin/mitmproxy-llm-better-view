<script setup lang="ts">
import { ref, computed } from 'vue';
import JsonViewer from '../../content/JsonViewer.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import type { FunctionCall } from '@/types/gemini/request';

interface Props {
  data: FunctionCall;
}

const props = defineProps<Props>();


// 将 args 对象格式化为 JSON 字符串用于 SmartViewer
const argsText = computed(() => JSON.stringify(props.data.args, null, 2));
</script>

<template>
  <div class="function-call">


    <!-- 格式化显示 -->
    <div  class="call-content">
      <div class="call-header">
        <span class="call-name">{{ data.name }}</span>
      </div>
      <SmartViewer :text="argsText" class="call-args" />
    </div>
  </div>
</template>

<style scoped>
.function-call {
  position: relative;
}





.call-content {
  background: #f8fafc;
  border-radius: 6px;
  padding: 2px;
}

.call-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1.4rem;
  color: #1e293b;
}



.call-name {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 600;
  /* color: #7c3aed; */
}

.call-args {
  margin: 8px 0 0 0;
}
</style>
