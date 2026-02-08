<script setup lang="ts">
import { ref, computed } from 'vue';
import JsonViewer from '../../content/JsonViewer.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import type { FunctionCall } from '@/types/gemini/request';

interface Props {
  data: FunctionCall;
}

const props = defineProps<Props>();

const showRaw = ref(false);

// 将 args 对象格式化为 JSON 字符串用于 SmartViewer
const argsText = computed(() => JSON.stringify(props.data.args, null, 2));
</script>

<template>
  <div class="function-call">
    <!-- Raw 切换按钮 -->
    <div class="raw-button-wrapper">
      <button class="view-raw-btn" @click="showRaw = !showRaw">
        {{ showRaw ? '▼' : '▶' }} Raw
      </button>
    </div>

    <!-- Raw 模式 -->
    <JsonViewer v-if="showRaw" :content="data" />

    <!-- 格式化显示 -->
    <div v-else class="call-content">
      <div class="call-header">
        <span class="badge-call">function_call</span>
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

.badge-call {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--llm-badge-tool-text);
}

.call-name {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 600;
  color: #7c3aed;
}

.call-args {
  margin: 8px 0 0 0;
}
</style>
