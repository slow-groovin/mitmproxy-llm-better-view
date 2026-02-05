<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { toast } from 'vue-sonner';
import type { ITransferService, TransferResult } from '../../lib/transfer/types';
import { logger } from '../../lib/logtape';
import { openaiTransferService } from '../../lib/transfer/openai-transfer-service';
import { geminiTransferService } from '../../lib/transfer/gemini-transfer-service';
import { claudeTransferService } from '../../lib/transfer/claude-transfer-service';

// Import view components
import OpenaiRequestView from '../../components/llm/openai/OpenaiRequestView.vue';
import OpenaiResponseView from '../../components/llm/openai/OpenaiResponseView.vue';
import OpenaiSSEView from '../../components/llm/openai/OpenaiSSEView.vue';
import ClaudeRequestView from '../../components/llm/claude/ClaudeRequestView.vue';
import ClaudeResponseView from '../../components/llm/claude/ClaudeResponseView.vue';
import ClaudeSSEView from '../../components/llm/claude/ClaudeSSEView.vue';
import GeminiRequestView from '../../components/llm/gemini/GeminiRequestView.vue';
import GeminiResponseView from '../../components/llm/gemini/GeminiResponseView.vue';
import GeminiSSEView from '../../components/llm/gemini/GeminiSSEView.vue';

interface Flow {
  id: string;
  request: {
    host: string;
    path: string;
    content: string;
  };
  response: {
    status_code: number;
    headers: Array<[string, string]>;
    contentLength: number;
    content: string;
  };
}

type Provider = 'openai' | 'claude' | 'gemini';
type ViewType = 'request' | 'response' | 'sse';

interface RenderState {
  provider: Provider;
  viewType: ViewType;
  data: unknown;
  rawSSE?: string;
}

const currentState = ref<RenderState | null>(null);
const loading = ref(false);
const flowId = ref<string | null>(null);
const flowInfo = ref<{ id: string; host: string; path: string } | null>(null);
const rawSSEExpanded = useLocalStorage('render-debug-raw-sse-expanded', true);
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

// Get provider-specific transfer service
function getTransferService(provider: Provider): ITransferService {
  switch (provider) {
    case 'openai': return openaiTransferService;
    case 'claude': return claudeTransferService;
    case 'gemini': return geminiTransferService;
  }
}

// Parse request content based on provider
function parseRequest(provider: Provider, content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

// Parse SSE events based on provider
function parseSSEEvents(provider: Provider, sseText: string): unknown[] {
  const events: unknown[] = [];
  const lines = sseText.split('\n');
  let currentEvent: { event?: string; data?: string } = {};

  for (const line of lines) {
    if (line.startsWith('event:')) {
      currentEvent.event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      currentEvent.data = line.slice(5).trim();
    } else if (line === '' && currentEvent.event && currentEvent.data) {
      try {
        events.push({
          event: currentEvent.event,
          type: 'chunk',
          timestamp: Date.now(),
          data: JSON.parse(currentEvent.data),
          raw: currentEvent.data
        });
      } catch {
        events.push({
          event: currentEvent.event,
          type: 'chunk',
          timestamp: Date.now(),
          raw: currentEvent.data
        });
      }
      currentEvent = {};
    }
  }

  return events;
}

// Main function to load and render data
async function loadData(provider: Provider, viewType: ViewType) {
  const url = window.location.href;
  const uuid = extractFlowId(url);

  if (!uuid) {
    toast.error('无法找到 Flow ID', {
      description: '请导航到 flow 页面 (#/flows/{uuid}/request 或 response)',
    });
    return;
  }

  loading.value = true;
  currentState.value = null;

  const loadingToastId = toast.loading(`加载 ${provider} ${viewType}...`);

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

    let data: unknown;
    let rawSSE: string | undefined;

    if (viewType === 'request') {
      // Parse request content
      data = parseRequest(provider, flow.request.content);
      logger.debug(`data: ${data}`)
    } else if (viewType === 'response') {
      // Use transfer service to convert SSE to response
      const transferService = getTransferService(provider);
      const sseContent = await transferService.getSSEContent(flow);
      const transferResult = transferService.transfer(sseContent);

      if (!transferResult.success) {
        throw new Error(transferResult.error || 'Transfer failed');
      }

      data = transferResult.data;
      rawSSE = transferResult.rawSSE;
    } else if (viewType === 'sse') {
      // Parse raw SSE events
      const transferService = getTransferService(provider);
      rawSSE = await transferService.getSSEContent(flow);
      data = parseSSEEvents(provider, rawSSE);
    }

    currentState.value = {
      provider,
      viewType,
      data,
      rawSSE,
    };

    toast.success('加载成功', {
      id: loadingToastId,
      description: `${provider} ${viewType} 数据已渲染`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    toast.error('加载失败', {
      id: loadingToastId,
      description: errorMsg,
    });
  } finally {
    loading.value = false;
  }
}

// Component mapping
const componentMap: Record<Provider, Record<ViewType, unknown>> = {
  openai: {
    request: OpenaiRequestView,
    response: OpenaiResponseView,
    sse: OpenaiSSEView,
  },
  claude: {
    request: ClaudeRequestView,
    response: ClaudeResponseView,
    sse: ClaudeSSEView,
  },
  gemini: {
    request: GeminiRequestView,
    response: GeminiResponseView,
    sse: GeminiSSEView,
  },
};

// Props mapping for different view types
const currentComponent = computed(() => {
  if (!currentState.value) return null;
  const { provider, viewType } = currentState.value;
  return componentMap[provider][viewType];
});

const currentProps = computed(() => {
  if (!currentState.value) return {};
  const { viewType, data } = currentState.value;

  if (viewType === 'sse') {
    // SSE views expect different props
    if (Array.isArray(data)) {
      return { chunks: data, events: data };
    }
  }

  return { data };
});

const currentFlowId = computed(() => flowId.value || extractFlowId(window.location.href) || 'Not found');
const hasData = computed(() => currentState.value !== null);
const hasError = computed(() => false);

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  } catch (error) {
    toast.error('复制失败');
  }
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

      <!-- 当前状态区 -->
      <div v-if="currentState" class="result-box">
        <div class="status-badge success">
          {{ currentState.provider }} {{ currentState.viewType }}
        </div>
        <div class="success-msg">
          {{ currentState.data ? '数据已加载' : '无数据' }}
        </div>
      </div>
    </div>

    <!-- 9个按钮组 -->
    <div class="button-grid">
      <!-- OpenAI -->
      <div class="button-group">
        <div class="group-label">OpenAI</div>
        <div class="group-buttons">
          <button class="render-btn openai" :class="{ disabled: loading }" :disabled="loading" @click="loadData('openai', 'request')">
            <span v-if="loading && currentState?.provider === 'openai' && currentState?.viewType === 'request'" class="loading-spinner"></span>
            Request
          </button>
          <button class="render-btn openai" :class="{ disabled: loading }" :disabled="loading" @click="loadData('openai', 'response')">
            <span v-if="loading && currentState?.provider === 'openai' && currentState?.viewType === 'response'" class="loading-spinner"></span>
            Response
          </button>
          <button class="render-btn openai" :class="{ disabled: loading }" :disabled="loading" @click="loadData('openai', 'sse')">
            <span v-if="loading && currentState?.provider === 'openai' && currentState?.viewType === 'sse'" class="loading-spinner"></span>
            SSE
          </button>
        </div>
      </div>

      <!-- Claude -->
      <div class="button-group">
        <div class="group-label">Claude</div>
        <div class="group-buttons">
          <button class="render-btn claude" :class="{ disabled: loading }" :disabled="loading" @click="loadData('claude', 'request')">
            <span v-if="loading && currentState?.provider === 'claude' && currentState?.viewType === 'request'" class="loading-spinner"></span>
            Request
          </button>
          <button class="render-btn claude" :class="{ disabled: loading }" :disabled="loading" @click="loadData('claude', 'response')">
            <span v-if="loading && currentState?.provider === 'claude' && currentState?.viewType === 'response'" class="loading-spinner"></span>
            Response
          </button>
          <button class="render-btn claude" :class="{ disabled: loading }" :disabled="loading" @click="loadData('claude', 'sse')">
            <span v-if="loading && currentState?.provider === 'claude' && currentState?.viewType === 'sse'" class="loading-spinner"></span>
            SSE
          </button>
        </div>
      </div>

      <!-- Gemini -->
      <div class="button-group">
        <div class="group-label">Gemini</div>
        <div class="group-buttons">
          <button class="render-btn gemini" :class="{ disabled: loading }" :disabled="loading" @click="loadData('gemini', 'request')">
            <span v-if="loading && currentState?.provider === 'gemini' && currentState?.viewType === 'request'" class="loading-spinner"></span>
            Request
          </button>
          <button class="render-btn gemini" :class="{ disabled: loading }" :disabled="loading" @click="loadData('gemini', 'response')">
            <span v-if="loading && currentState?.provider === 'gemini' && currentState?.viewType === 'response'" class="loading-spinner"></span>
            Response
          </button>
          <button class="render-btn gemini" :class="{ disabled: loading }" :disabled="loading" @click="loadData('gemini', 'sse')">
            <span v-if="loading && currentState?.provider === 'gemini' && currentState?.viewType === 'sse'" class="loading-spinner"></span>
            SSE
          </button>
        </div>
      </div>
    </div>

    <!-- 渲染内容区 -->
    <div v-if="currentState" class="render-content">
      <div class="render-header">
        <h3>{{ currentState.provider }} {{ currentState.viewType }}</h3>
        <button v-if="currentState.rawSSE" class="copy-btn" @click="copyToClipboard(currentState.rawSSE)">
          复制 SSE
        </button>
      </div>
      <div class="render-body">
        <component
          :is="currentComponent"
          v-bind="currentProps"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>点击上方按钮加载数据</p>
      <p class="hint">支持 OpenAI / Claude / Gemini 的 Request / Response / SSE 渲染</p>
    </div>
  </div>
</template>

<style scoped>
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
