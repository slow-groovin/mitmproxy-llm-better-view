<script setup lang="ts">
import { ref } from 'vue';
import OpenaiToolCallArgs from './OpenaiToolCallArgs.vue';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string | object;
  };
}

interface Props {
  toolCalls: ToolCall[];
}

const props = defineProps<Props>();

const showRaw = ref(false);

function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
}
</script>
<template>
  <div class="tool-calls">
     <!-- Raw 切换按钮 - 使用 flex wrapper -->
    <div class="raw-button-wrapper">
      <button class="view-raw-btn" @click="showRaw = !showRaw">
        {{ showRaw ? '▼' : '▶' }} Raw
      </button>
    </div>

    <!-- Raw 模式 -->
    <pre v-if="showRaw" class="raw-content">{{ JSON.stringify(toolCalls, null, 2) }}</pre>

    <!-- 格式化显示 -->
    <div v-else class="tool-requests">
      <div v-for="(req, idx) in toolCalls" :key="req.id" class="tool-request">
        <div class="tool-request-header">
          <span class="badge-call">tool_call</span>
          <span class="tool-idx">#{{ idx + 1 }}</span>

          <a class="tool-fn clickable" @click.prevent="scrollTo(`#tool-def-${req.function.name}`)">
            {{ req.function.name }}
          </a>
          <a 
            :id="`tool-request-${req.id}`"
            class="tool-id clickable"
            @click.prevent="scrollTo(`#tool-response-${req.id}`)"
          >
            {{ req.id }}
          </a>
        </div>
        
        <OpenaiToolCallArgs :arguments="req.function.arguments" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-calls {
  margin-top: 2px;
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

.raw-content {
  margin: 24px 0 8px;
  padding: 4px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 1.2rem;
  overflow-x: auto;
  color: #475569;
}

.tool-requests {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-request {
  background: #f8fafc;
  border-radius: 6px;
  padding: 2px;
}

.tool-request-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 1.4rem;
  color: #1e293b;
}

.badge-call {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #dbeafe;
  color: #1d4ed8;
}

.tool-idx {
  color: #64748b;
  font-size: 1.2rem;
}

.tool-id {
  margin-left: auto;
  font-size: 1.1rem;
  color: #94a3b8;
  font-family: 'Monaco', 'Menlo', monospace;
}

.clickable {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  border-bottom: 1px dotted transparent;
  transition: all 0.2s;
}

.clickable:hover {
  color: #1d4ed8;
  border-bottom-color: #1d4ed8;
}
</style>