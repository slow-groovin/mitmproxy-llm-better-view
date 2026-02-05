<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { toast } from 'vue-sonner';
import type { ITransferService, TransferResult } from '../../lib/transfer/types';
import { logger } from '../../lib/logtape';
import { openaiTransferService } from '../../lib/transfer/openai-transfer-service';
import { geminiTransferService } from '../../lib/transfer/gemini-transfer-service';
import { claudeTransferService } from '../../lib/transfer/claude-transfer-service';

interface Flow {
  id: string;
  request: {
    host: string;
    path: string;
  };
  response: {
    status_code: number;
    headers: Array<[string, string]>;
    contentLength: number;
  };
}

const result = ref<TransferResult | null>(null);
const loading = ref(false);
const flowId = ref<string | null>(null);
const flowInfo = ref<{ id: string; host: string; path: string } | null>(null);
const rawSSEExpanded = useLocalStorage('transfer-debug-raw-sse-expanded', true);
const detailsRef = ref<HTMLDetailsElement | null>(null);

// 同步 details 元素的 open 状态
watch(rawSSEExpanded, (newVal) => {
  if (detailsRef.value) {
    detailsRef.value.open = newVal;
  }
}, { immediate: true });

// 监听 details 的 toggle 事件
function onToggle(event: Event) {
  rawSSEExpanded.value = (event.target as HTMLDetailsElement).open;
}

function extractFlowId(url: string): string | null {
  const regex = /#\/flows\/([0-9a-fA-F\-]{36})\/(request|response)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function getFlow(uuid: string): Promise<Flow | null> {
  const response = await fetch(`http://${window.location.host}/flows`);
  if (!response.ok) {
    throw new Error(`Failed to fetch flows: ${response.statusText}`);
  }
  const flowArray = await response.json();
  return flowArray.find((flow: Flow) => flow.id === uuid) || null;
}

async function performTransfer(transferService: ITransferService) {
  const url = window.location.href;
  const uuid = extractFlowId(url);

  if (!uuid) {
    toast.error('无法找到 Flow ID', {
      description: '请导航到 flow 页面 (#/flows/{uuid}/request 或 response)',
    });
    return;
  }

  loading.value = true;
  result.value = null;

  const loadingToastId = toast.loading('获取 flow 并转换中...');

  try {
    const flow = await getFlow(uuid);
    if (!flow) {
      throw new Error(`Flow not found with ID: ${uuid}`);
    }
    logger.debug`flow: ${flow}`;

    flowId.value = uuid;
    flowInfo.value = {
      id: flow.id,
      host: flow.request.host,
      path: flow.request.path,
    };

    const sseContent = await transferService.getSSEContent(flow);
    logger.debug`sseContent: ${sseContent}`;
    const transferResult = transferService.transfer(sseContent);
    result.value = transferResult;

    if (transferResult.success) {
      toast.success('转换成功', {
        id: loadingToastId,
        description: `处理了 ${transferResult.data ? JSON.stringify(transferResult.data, null, 2).length : 0} 字符`,
      });
    } else {
      toast.error('转换失败', {
        id: loadingToastId,
        description: transferResult.error || '未知错误',
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.value = {
      success: false,
      error: errorMsg,
      timestamp: Date.now(),
    };
    toast.error('转换出错', {
      id: loadingToastId,
      description: errorMsg,
    });
  } finally {
    loading.value = false;
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  } catch (error) {
    toast.error('复制失败');
  }
}

const currentFlowId = computed(() => flowId.value || extractFlowId(window.location.href) || 'Not found');
const hasData = computed(() => result.value?.success && result.value.data);
const hasError = computed(() => result.value && !result.value.success);
const formattedData = computed(() => {
  if (!hasData.value) return '';
  return JSON.stringify(result.value!.data, null, 2);
});
</script>

<template>
  <div class="transfer-debug">
    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <!-- 标题区 -->
      <div class="header-box">
        <h2>Transfer Debug</h2>
        <p>Test LLM SSE to Response conversion</p>
      </div>

      <!-- Flow 信息区 -->
      <div class="info-box">
        <div class="info-row">
          <span class="label">Flow ID:</span>
          <span class="value">{{ currentFlowId }}</span>
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

      <!-- 结果状态区 -->
      <div v-if="result" class="result-box">
        <div class="status-badge" :class="{ success: result.success, error: !result.success }">
          {{ result.success ? '成功' : '失败' }}
        </div>
        <div v-if="hasError" class="error-msg">{{ result.error }}</div>
        <div v-else class="success-msg">
          {{ new Date(result.timestamp).toLocaleString() }}
        </div>
      </div>
    </div>

    <div class="button-group">
      <button class="transfer-btn" :class="{ disabled: loading }" :disabled="loading" @click="performTransfer(openaiTransferService)">
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '转换中...' : 'OpenAI' }}
      </button>
      <button class="transfer-btn" :class="{ disabled: loading }" :disabled="loading" @click="performTransfer(claudeTransferService)">
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '转换中...' : 'Claude' }}
      </button>
      <button class="transfer-btn" :class="{ disabled: loading }" :disabled="loading" @click="performTransfer(geminiTransferService)">
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '转换中...' : 'Gemini' }}
      </button>
    </div>

    <!-- 结果详情 -->
    <div v-if="result" class="results">
      <!-- Raw SSE -->
      <details v-if="result.rawSSE" ref="detailsRef" :open="rawSSEExpanded" class="section" @toggle="onToggle">
        <summary class="section-header">
          <h3>Raw SSE</h3>
          <button class="copy-btn" @click.stop="copyToClipboard(result.rawSSE!)">复制</button>
        </summary>
        <pre class="code-block">{{ result.rawSSE }}</pre>
      </details>

      <!-- Parsed Response -->
      <div v-if="hasData" class="section">
        <div class="section-header">
          <h3>Parsed Response</h3>
          <button class="copy-btn" @click="copyToClipboard(formattedData)">复制</button>
        </div>
        <pre class="code-block full-height">{{ formattedData }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transfer-debug {
  padding: 12px;
  overflow-y: auto;
  max-height: 100%;
}

.top-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
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

.button-group {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.transfer-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  flex: 1;
}

.transfer-btn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.transfer-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 12px;
  height: 12px;
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

.status-badge.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.error-msg {
  color: #ef4444;
  font-size: 12px;
  word-break: break-word;
}

.success-msg {
  color: #10b981;
  font-size: 11px;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

details.section>summary {
  cursor: pointer;
  user-select: none;
}

details.section>summary::marker {
  content: '▶ ';
  color: #667eea;
}

details.section[open]>summary::marker {
  content: '▼ ';
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
}

.section-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
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

.code-block {
  margin: 0;
  padding: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #e5e7eb;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
}

.code-block.full-height {
  max-height: none;
  overflow-y: visible;
}
</style>