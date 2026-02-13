<script setup lang="ts">
import { computed, ref, onErrorCaptured, defineAsyncComponent } from 'vue';
import type { ApiStandard, DataType } from '@/types/flow';
import type { TransferResult } from '@/lib/transfer/types';
import { unifiedTransferData } from '@/lib/transfer/unified';

interface Props {
  standard: ApiStandard;
  dataType: DataType;
  data: string;
  path?: string;
}

const props = defineProps<Props>();

// 定义emit事件
const emit = defineEmits<{
  'update:standard': [standard: ApiStandard];
}>();

// 可用的标准选项
const standardOptions: { value: ApiStandard; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
];

// 用户手动选择的标准（null 表示未手动选择，使用 props.standard）
const manualStandard = ref<ApiStandard | null>(null);

// 合并后的有效标准：优先使用手动选择，否则使用 props
const effectiveStandard = computed<ApiStandard>(() => {
  return manualStandard.value ?? props.standard;
});

// 处理标准切换
const handleStandardChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newStandard = target.value as ApiStandard;
  manualStandard.value = newStandard;
  emit('update:standard', newStandard);
};

// 使用 defineAsyncComponent 定义异步组件
const componentMap = {
  openai: {
    request: defineAsyncComponent(() => import('./openai/OpenaiRequestView.vue')),
    response: defineAsyncComponent(() => import('./openai/OpenaiResponseView.vue')),
    sse: defineAsyncComponent(() => import('./openai/OpenaiResponseView.vue')),
  },
  claude: {
    request: defineAsyncComponent(() => import('./claude/ClaudeRequestView.vue')),
    response: defineAsyncComponent(() => import('./claude/ClaudeResponseView.vue')),
    // SSE 数据会被转换成完整的 response 再渲染
    sse: defineAsyncComponent(() => import('./claude/ClaudeResponseView.vue')),
  },
  gemini: {
    request: defineAsyncComponent(() => import('./gemini/GeminiRequestView.vue')),
    response: defineAsyncComponent(() => import('./gemini/GeminiResponseView.vue')),
    sse: defineAsyncComponent(() => import('./gemini/GeminiResponseView.vue')),
  },
} as const;

// 组件错误捕获
const componentError = ref<Error | null>(null);
const hasComponentError = computed(() => componentError.value !== null);

onErrorCaptured((err: Error) => {
  console.error('子组件错误:', err);
  componentError.value = err;
  return false;
});

// 数据转换（使用合并后的 effectiveStandard）
const transferResult = computed<TransferResult>(() => {
  try {
    return unifiedTransferData(effectiveStandard.value, props.dataType, props.data);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '数据转换失败',
      timestamp: Date.now()
    };
  }
});

// 获取当前组件（使用合并后的 effectiveStandard）
const currentComponent = computed(() => {
  return componentMap[effectiveStandard.value]?.[props.dataType];
});

// 组件数据
const componentData = computed(() => {
  return transferResult.value.success ? transferResult.value.data : null;
});

// 错误信息
const errorMessage = computed(() => {
  if (hasComponentError.value) {
    return `组件渲染错误: ${componentError.value?.message}`;
  }
  return transferResult.value.error || null;
});

// 重试
const retry = () => {
  componentError.value = null;
};
</script>

<template>
  <div class="view-dashboard-proxy">
    <!-- 低调的下拉切换框：用于手动切换API标准 -->
    <div class="standard-selector">
      <select :value="effectiveStandard" @change="handleStandardChange" class="standard-select">
        <option v-for="opt in standardOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- 组件错误 -->
    <div v-if="hasComponentError" class="error-state">
      <div class="error-icon">💥</div>
      <div class="error-title">组件加载失败</div>
      <div class="error-message">{{ componentError?.message }}</div>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <!-- 数据错误 -->
    <div v-else-if="errorMessage" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-title">数据解析失败</div>
      <div class="error-message">{{ errorMessage }}</div>
    </div>

    <!-- 空数据 -->
    <div v-else-if="!componentData" class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-title">暂无数据</div>
    </div>

    <!-- 正常渲染 -->
    <Suspense v-else>
      <!-- @vue-ignore -->
      <component :is="currentComponent" :data="componentData" :path="path" />
      <template #fallback>
        <div class="loading-state">⏳ 加载中...</div>
      </template>
    </Suspense>
  </div>
</template>

<style scoped>
.view-dashboard-proxy {
  position: relative;
}

/* 低调的标准选择器：放置在右上角，最小化视觉干扰 */
.standard-selector {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
}

.standard-select {
  /* 极其低调的样式 */
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.8);
  color: #666;
  cursor: pointer;
  outline: none;
  opacity: 0.6;
  transition: opacity 0.2s, border-color 0.2s;
}

.standard-select:hover {
  opacity: 1;
  border-color: #ccc;
}

.standard-select:focus {
  opacity: 1;
  border-color: #999;
}
</style>