<script setup lang="ts">
import SmartViewer from '@/components/content/SmartViewer.vue';
import type { FunctionResponse } from '@/types/gemini/request';

interface Props {
  data: FunctionResponse;
}

defineProps<Props>();

</script>

<template>
  <div class="function-response">



    <!-- 格式化显示 -->
    <div class="response-content">
      <div class="response-header">
        <span class="response-name">{{ data.name }}</span>
      </div>
      <SmartViewer v-if="data.response['content']" :text="data.response['content'] as string">
      </SmartViewer>
    </div>
  </div>
</template>

<style scoped>
.function-response {
  position: relative;
}




.response-content {
  background: #f8fafc;
  border-radius: 6px;
  padding: 2px;
}





.response-name {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 800;
}

.response-data {
  margin: 8px 0 0 0;
}
</style>
