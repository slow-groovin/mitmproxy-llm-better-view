<script setup lang="ts">
import { ref } from 'vue';
import JsonViewer from '../../content/JsonViewer.vue';
import type { FunctionResponse } from '@/types/gemini/request';

interface Props {
  data: FunctionResponse;
}

defineProps<Props>();

const showRaw = ref(false);
</script>

<template>
  <div class="function-response">
    <!-- Raw 切换按钮 -->
    <div class="raw-button-wrapper">
      <button class="view-raw-btn" @click="showRaw = !showRaw">
        {{ showRaw ? '▼' : '▶' }} Raw
      </button>
    </div>

    <!-- Raw 模式 -->
    <JsonViewer v-if="showRaw" :content="data" />

    <!-- 格式化显示 -->
    <div v-else class="response-content">
      <div class="response-header">
        <span class="badge-response">function_response</span>
        <span class="response-name">{{ data.name }}</span>
      </div>
      <pre class="response-data">{{ JSON.stringify(data.response, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.function-response {
  position: relative;
}

.raw-button-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: -2px;
}

.view-raw-btn {
  padding: 1px 2px;
  font-size: 0.9rem;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.view-raw-btn:hover {
  color: #1d4ed8;
}

.response-content {
  background: #f8fafc;
  border-radius: 6px;
  padding: 2px;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1.4rem;
  color: #1e293b;
}

.badge-response {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--llm-badge-tool-text);
}

.response-name {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 600;
  color: #7c3aed;
}

.response-data {
  margin: 8px 0 0 0;
}
</style>
