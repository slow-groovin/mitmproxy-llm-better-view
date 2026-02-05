<script setup lang="ts">
import { watch, computed, shallowRef, onMounted } from 'vue';
import { dashboardData, dashboardView, initDashboardInjector, destroyDashboardInjector } from '../main';
import { logger } from '../lib/logtape';

// Import type guards
import {
  isOpenAIReq,
  isOpenAIRes,
  isOpenAISSE,
  isClaudeReq,
  isClaudeRes,
  isClaudeSSE,
  isGeminiReq,
  isGeminiRes,
  isGeminiSSE
} from '../llm/judge';

// Import platform-specific view components
import OpenaiRequestView from '../components/llm/openai/OpenaiRequestView.vue';
import OpenaiResponseView from '../components/llm/openai/OpenaiResponseView.vue';
import OpenaiSSEView from '../components/llm/openai/OpenaiSSEView.vue';

import ClaudeRequestView from '../components/llm/claude/ClaudeRequestView.vue';
import ClaudeResponseView from '../components/llm/claude/ClaudeResponseView.vue';
import ClaudeSSEView from '../components/llm/claude/ClaudeSSEView.vue';

import GeminiRequestView from '../components/llm/gemini/GeminiRequestView.vue';
import GeminiResponseView from '../components/llm/gemini/GeminiResponseView.vue';
import GeminiSSEView from '../components/llm/gemini/GeminiSSEView.vue';

import JsonViewer from '../components/llm/shared/JsonViewer.vue';

// View tabs
const viewTabs = [
  { id: 'auto', label: 'Auto' },
  { id: 'request', label: 'Request' },
  { id: 'response', label: 'Response' },
  { id: 'sse', label: 'SSE' },
  { id: 'raw', label: 'Raw' }
] as const;

type ViewTabId = typeof viewTabs[number]['id'];

// Local view state (can be overridden by user)
const localView = ref<ViewTabId>('auto');
const isInjected = ref(false);

// Computed current view
const currentView = computed(() => {
  // If user selected explicit view, use it
  if (localView.value !== 'auto') {
    return localView.value;
  }
  // Otherwise use auto-detected view from main.ts
  return dashboardView.value;
});

// Computed platform
const platform = computed(() => {
  return dashboardData.value?.platform || null;
});

// Computed data
const data = computed(() => {
  return dashboardData.value?.data || null;
});

// Auto-detect view from data type
const autoDetectedView = computed('auto' | 'request' | 'response' | 'sse' | 'raw'>(() => {
  if (!dashboardData.value) return 'raw';

  const { type, data: d } = dashboardData.value;

  // Try type detection functions first
  if (isOpenAIReq(type, d, dashboardData.value.flow)) return 'request';
  if (isOpenAIRes(type, d, dashboardData.value.flow)) return 'response';
  if (isOpenAISSE(type, d, dashboardData.value.flow)) return 'sse';
  if (isClaudeReq(type, d, dashboardData.value.flow)) return 'request';
  if (isClaudeRes(type, d, dashboardData.value.flow)) return 'response';
  if (isClaudeSSE(type, d, dashboardData.value.flow)) return 'sse';
  if (isGeminiReq(type, d, dashboardData.value.flow)) return 'request';
  if (isGeminiRes(type, d, dashboardData.value.flow)) return 'response';
  if (isGeminiSSE(type, d, dashboardData.value.flow)) return 'sse';

  return 'raw';
});

// Update dashboardView when auto-detected view changes
watch(autoDetectedView, (newView) => {
  if (localView.value === 'auto') {
    dashboardView.value = newView;
  }
});

// Determine which component to render
const activeComponent = shallowRef<any>(null);

// Map platform and view to components
const getComponent = () => {
  if (!platform.value || !data.value) {
    return null;
  }

  const view = currentView.value;

  // Raw view for any platform
  if (view === 'raw') {
    return JsonViewer;
  }

  // OpenAI platform
  if (platform.value === 'openai') {
    if (view === 'request') return OpenaiRequestView;
    if (view === 'response') return OpenaiResponseView;
    if (view === 'sse') return OpenaiSSEView;
  }

  // Claude platform
  if (platform.value === 'claude') {
    if (view === 'request') return ClaudeRequestView;
    if (view === 'response') return ClaudeResponseView;
    if (view === 'sse') return ClaudeSSEView;
  }

  // Gemini platform
  if (platform.value === 'gemini') {
    if (view === 'request') return GeminiRequestView;
    if (view === 'response') return GeminiResponseView;
    if (view === 'sse') return GeminiSSEView;
  }

  // Fallback to raw JSON
  return JsonViewer;
};

// Update active component when platform or view changes
watch([platform, currentView], () => {
  activeComponent.value = getComponent();
});

// Platform display name
const platformName = computed(() => {
  switch (platform.value) {
    case 'openai': return 'OpenAI';
    case 'claude': return 'Claude';
    case 'gemini': return 'Gemini';
    default: return 'Unknown';
  }
});

// Format data type for display
const dataTypeDisplay = computed(() => {
  return dashboardData.value?.type || 'unknown';
});

// Handle inject/destroy
function handleInject() {
  try {
    initDashboardInjector();
    isInjected.value = true;
    logger.info('Dashboard injected');
  } catch (error) {
    logger.error('Failed to inject dashboard:', error);
  }
}

function handleDestroy() {
  try {
    destroyDashboardInjector();
    isInjected.value = false;
    logger.info('Dashboard destroyed');
  } catch (error) {
    logger.error('Failed to destroy dashboard:', error);
  }
}

function setView(viewId: ViewTabId) {
  localView.value = viewId;
  logger.debug('View changed', { view: viewId, auto: viewId === 'auto' });
}

// Auto-inject when data is available
watch(dashboardData, (newData) => {
  if (newData && !isInjected.value) {
    handleInject();
  }
});

// Auto-inject on mount if data exists
onMounted(() => {
  if (dashboardData.value && !isInjected.value) {
    handleInject();
  }
});
</script>

<template>
  <div class="dashboard">
    <!-- Control Bar -->
    <div class="control-bar">
      <div class="control-bar-left">
        <!-- Platform Badge -->
        <div v-if="platform" class="platform-badge" :class="platform">
          {{ platformName }}
        </div>

        <!-- Data Type -->
        <div class="data-type">
          {{ dataTypeDisplay }}
        </div>

        <!-- View Tabs -->
        <div class="view-tabs">
          <button
            v-for="tab in viewTabs"
            :key="tab.id"
            :class="['view-tab', { active: localView === tab.id }]"
            @click="setView(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="control-bar-right">
        <!-- Inject/Destroy Buttons -->
        <button
          class="control-btn inject-btn"
          @click="handleInject"
          :disabled="isInjected"
        >
          {{ isInjected ? '✓ Injected' : 'Inject' }}
        </button>
        <button
          class="control-btn destroy-btn"
          @click="handleDestroy"
          :disabled="!isInjected"
        >
          Destroy
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <div v-if="!dashboardData" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No Data Available</div>
        <div class="empty-description">
          Send an LLM API request to see the visualization
        </div>
      </div>

      <div v-else-if="activeComponent" class="component-wrapper">
        <component :is="activeComponent" v-bind="data" />
      </div>

      <div v-else class="fallback-state">
        <div class="fallback-icon">⚠️</div>
        <div class="fallback-title">Unsupported Format</div>
        <JsonViewer :data="data" :collapsible="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  background: #f8fafc;
}

/* Control Bar */
.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.control-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.control-bar-right {
  display: flex;
  gap: 8px;
}

/* Platform Badge */
.platform-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.platform-badge.openai {
  background: #dbeafe;
  color: #1d4ed8;
}

.platform-badge.claude {
  background: #fef3c7;
  color: #92400e;
}

.platform-badge.gemini {
  background: #fce7f3;
  color: #9f1239;
}

/* Data Type */
.data-type {
  padding: 4px 8px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* View Tabs */
.view-tabs {
  display: flex;
  gap: 4px;
}

.view-tab {
  padding: 6px 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #64748b;
  transition: all 0.2s;
}

.view-tab:hover {
  background: #e2e8f0;
}

.view-tab.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Control Buttons */
.control-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.inject-btn {
  background: #42b883;
  color: white;
}

.inject-btn:hover:not(:disabled) {
  background: #36a374;
}

.destroy-btn {
  background: #f44336;
  color: white;
}

.destroy-btn:hover:not(:disabled) {
  background: #d32f2f;
}

/* Content Area */
.content-area {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.component-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 0.875rem;
  color: #64748b;
}

/* Fallback State */
.fallback-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fallback-icon {
  font-size: 2rem;
  text-align: center;
}

.fallback-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}
</style>
