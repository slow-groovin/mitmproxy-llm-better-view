<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { toast } from 'vue-sonner';
import { useCurrentFlowStore } from '../../store/llm';
import type { ApiStandard, DataType } from '../../types/flow'
import ViewDashboardProxy from '@/components/llm/ViewDashboardProxy.vue';



// Store 中的值(自动检测)
const { standard: standard, dataType: dataType, dataAsText: dataAsText, flowId } = useCurrentFlowStore();

// 用户手动选择的值
const userStandard = ref<ApiStandard | null>(null);
const userDataType = ref<DataType | null>(null);

// 实际使用的值:优先用户选择,否则用 store
const activeStandard = computed(() => userStandard.value ?? standard);
const activeDataType = computed(() => userDataType.value ?? dataType);

// const currentState = ref<RenderState | null>(null);
const loading = ref(false);
const flowInfo = ref<{ id: string; host: string; path: string } | null>(null);

const rawSSEExpanded = useLocalStorage('render-debug-raw-sse-expanded', true);
const detailsRef = ref<HTMLDetailsElement | null>(null);

watch(rawSSEExpanded, (newVal) => {
  if (detailsRef.value) {
    detailsRef.value.open = newVal;
  }
}, { immediate: true });

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  } catch (error) {
    toast.error('复制失败');
  }
}

function refreshData(standard: ApiStandard, datatype: DataType) {
  userStandard.value = standard
  userDataType.value = datatype
}
</script>

<template>
  <div class="render-debug">
    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <!-- 标题区 -->
      <div class="header-box">
        <h2>Render Debug</h2>
        <p>Render LLM Request/Response/SSE data</p>
      </div>

      <!-- Store 自动检测值 -->
      <div class="info-box">
        <div class="info-row">
          <span class="label">检测到:</span>
          <span class="value">{{ standard }} - {{ dataType }}</span>
        </div>
        <div class="info-row">
          <span class="label">当前使用:</span>
          <span class="value">{{ activeStandard }} - {{ activeDataType }}</span>
        </div>
      </div>

      <!-- Flow 信息区 -->
      <div class="info-box">
        <div class="info-row">
          <span class="label">Flow ID:</span>
          <span class="value">{{ flowId }}</span>
        </div>
        <div v-if="flowInfo" class="info-row">
          <span class="label">Host:</span>
          <span class="value">{{ flowInfo.host }}</span>
        </div>
        <div v-if="flowInfo" class="info-row">
          <span class="label">Path:</span>
          <span class="value">{{ flowInfo.path }}</span>
        </div>
      </div>

      <!-- 当前状态区 -->
      <div class="result-box">
        <div class="status-badge success">
          {{ activeStandard }} {{ activeDataType }}
        </div>
        <div class="success-msg">
          {{ dataAsText ? '数据已加载' : '无数据' }}
        </div>
      </div>
    </div>

    <!-- 9个按钮组 -->
    <div class="button-grid">
      <!-- OpenAI -->
      <div class="button-group">
        <div class="group-label">OpenAI</div>
        <div class="group-buttons">
          <button class="render-btn openai" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('openai', 'request')">

            Request
          </button>
          <button class="render-btn openai" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('openai', 'response')">

            Response
          </button>
          <button class="render-btn openai" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('openai', 'sse')">
            SSE
          </button>
        </div>
      </div>

      <!-- Claude -->
      <div class="button-group">
        <div class="group-label">Claude</div>
        <div class="group-buttons">
          <button class="render-btn claude" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('claude', 'request')">
            Request
          </button>
          <button class="render-btn claude" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('claude', 'response')">
            Response
          </button>
          <button class="render-btn claude" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('claude', 'sse')">
            SSE
          </button>
        </div>
      </div>

      <!-- Gemini -->
      <div class="button-group">
        <div class="group-label">Gemini</div>
        <div class="group-buttons">
          <button class="render-btn gemini" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('gemini', 'request')">
            Request
          </button>
          <button class="render-btn gemini" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('gemini', 'response')">
            Response
          </button>
          <button class="render-btn gemini" :class="{ disabled: loading }" :disabled="loading"
            @click="refreshData('gemini', 'sse')">
            SSE
          </button>
        </div>
      </div>
    </div>

    <view-dashboard-proxy v-if="activeDataType && activeStandard && dataAsText" :data-type="activeDataType"
      :standard="activeStandard" :data="dataAsText" />

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>点击上方按钮加载数据</p>
      <p class="hint">支持 OpenAI / Claude / Gemini 的 Request / Response / SSE 渲染</p>
    </div>
  </div>
</template>

<style scoped>
/* 样式保持不变 */
.render-debug {
  padding: 12px;
  overflow-y: auto;
  max-height: 100%;
}

.top-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: stretch;
}

.header-box,
.info-box,
.result-box {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header-box {
  flex-shrink: 0;
  min-width: 200px;
}

.header-box h2 {
  margin: 0 0 4px 0;
  color: #667eea;
  font-size: 16px;
}

.header-box p {
  margin: 0;
  color: #aaa;
  font-size: 12px;
}

.info-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.label {
  color: #aaa;
  min-width: 60px;
}

.value {
  color: #fff;
  font-family: monospace;
  word-break: break-all;
}

.result-box {
  flex-shrink: 0;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  text-align: center;
}

.status-badge.success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.success-msg {
  color: #10b981;
  font-size: 11px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.button-group {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.group-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #667eea;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.group-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.render-btn {
  padding: 6px 10px;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.render-btn.openai {
  background: linear-gradient(135deg, #10a37f 0%, #0d8c6d 100%);
}

.render-btn.claude {
  background: linear-gradient(135deg, #d97757 0%, #b86447 100%);
}

.render-btn.gemini {
  background: linear-gradient(135deg, #4285f4 0%, #3367d6 100%);
}

.render-btn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.render-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.render-content {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.render-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.render-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.copy-btn {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.render-body {
  padding: 12px;
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.empty-state .hint {
  font-size: 12px;
  color: #666;
}
</style>