<script setup lang="ts">
import { computed, ref, onErrorCaptured, defineAsyncComponent } from 'vue';
import type { ApiStandard, DataType } from '@/types/flow';
import type { TransferResult } from '@/lib/transfer/types';
import { unifiedTransferData } from '@/lib/transfer/unified';

interface Props {
  standard: ApiStandard;
  dataType: DataType;
  data: string;
}

const props = defineProps<Props>();

// 使用 defineAsyncComponent 定义异步组件
const componentMap = {
  openai: {
    request: defineAsyncComponent(() => import('./openai/OpenaiRequestView.vue')),
    response: defineAsyncComponent(() => import('./openai/OpenaiResponseView.vue')),
    sse: defineAsyncComponent(() => import('./openai/OpenaiSSEView.vue')),
  },
  claude: {
    request: defineAsyncComponent(() => import('./claude/ClaudeRequestView.vue')),
    response: defineAsyncComponent(() => import('./claude/ClaudeResponseView.vue')),
    sse: defineAsyncComponent(() => import('./claude/ClaudeSSEView.vue')),
  },
  gemini: {
    request: defineAsyncComponent(() => import('./gemini/GeminiRequestView.vue')),
    response: defineAsyncComponent(() => import('./gemini/GeminiResponseView.vue')),
    sse: defineAsyncComponent(() => import('./gemini/GeminiSSEView.vue')),
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

// 数据转换
const transferResult = computed<TransferResult>(() => {
  try {
    return unifiedTransferData(props.standard, props.dataType, props.data);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '数据转换失败',
      timestamp: Date.now()
    };
  }
});

// 获取当前组件
const currentComponent = computed(() => {
  return componentMap[props.standard]?.[props.dataType];
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
      <component :is="currentComponent" :data="componentData" />
      <template #fallback>
        <div class="loading-state">⏳ 加载中...</div>
      </template>
    </Suspense>
  </div>
</template>

<style scoped>
/* ... 样式保持不变 ... */
</style>