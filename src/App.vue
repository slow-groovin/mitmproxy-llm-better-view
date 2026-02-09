<script setup lang="ts">
import 'vue-sonner/style.css';
import { toast, Toaster } from 'vue-sonner';
import { onMounted, ref, shallowRef, type Component } from 'vue';
import { logger } from './lib/logtape';
import { HookFunc, initRouteListener } from './lib/pipeline';
import { isOpenAIReq, isOpenAIRes, isSSE, isAnthropicReq, isAnthropicRes, isGeminiReq, isGeminiRes } from './llm/judge';
import { useCurrentFlowStore } from './store/llm';
import { ApiStandard, DataType } from './types/flow';
import { initPageInjector } from './lib/page-injector';
import Dashboard from './pages/Dashboard.vue';

const showDebug = ref(false);
const isDev = import.meta.env.DEV
const DebugHome = shallowRef<Component>();

// 动态导入debug页面 - 生产构建时此代码不会执行, 因为isDev为false
// 使用动态import确保debug页面代码被正确分割
async function toggleDebug() {
  if (!DebugHome.value) {
    // 开发环境: 动态导入实际组件
    // 生产环境: 此分支不会被执行 (isDev为false)
    const module = await import('./pages/debug/DebugHome.vue');
    DebugHome.value = module.default as Component;
  }
  showDebug.value = !showDebug.value;
}


const { setLLMData } = useCurrentFlowStore();

onMounted(() => {
  // Hook function for processing LLM requests/responses
  const handleLLMData: HookFunc = (type, flowData, flow) => {
    logger.debug`Detected request/response ${{ type, flowData, flow }}`;
    try {
      let standard: ApiStandard | null = null;
      let dataType: DataType | null = null;
      const dataAsText = flowData.text
      // Parse the response data
      // const data = parseResponseData(dataAsText);
      // logger.debug`dataTExt: ${dataAsText}`
      // Detect platform and view type
      if (isOpenAIReq(type, dataAsText, flow)) {
        standard = 'openai';
        dataType = 'request';
        toast('OpenAI Request detected');
      } else if (isOpenAIRes(type, dataAsText, flow)) {
        standard = 'openai';
        if (isSSE(flow)) {
          dataType = 'sse';
          toast('OpenAI SSE detected');
        } else {
          dataType = 'response';
          toast('OpenAI Response detected');
        }
      } else if (isAnthropicReq(type, dataAsText, flow)) {
        standard = 'claude';
        dataType = 'request';
        toast('Claude Request detected');
      } else if (isAnthropicRes(type, dataAsText, flow)) {
        standard = 'claude';
        if (isSSE(flow)) {
          dataType = 'sse';
          toast('Claude SSE detected');
        } else {
          dataType = 'response';
          toast('Claude Response detected');
        }
      } else if (isGeminiReq(type, dataAsText, flow)) {
        standard = 'gemini';
        dataType = 'request';
        toast('Gemini Request detected');
      } else if (isGeminiRes(type, dataAsText, flow)) {
        standard = 'gemini';
        if (isSSE(flow)) {
          dataType = 'sse';
          toast('Gemini SSE detected');
        } else {
          dataType = 'response';
          toast('Gemini Response detected');
        }
      }

      if (standard && dataAsText && dataType) {
        setLLMData(standard, dataType, dataAsText, flow);

        logger.info`Dashboard data updated  ${{ standard: standard, view: dataType }}`;

        initPageInjector({
          component: Dashboard,
        });
      } else {
        logger.warn('Unknown type or no data', { type, hasData: !!dataAsText });
      }
    } catch (error) {
      logger.error(error as Error);
      toast('Error processing request');
    }

    // Return null to not modify the original response
    return null;
  };

  // Initialize route listener
  initRouteListener(handleLLMData);


})

</script>

<template>
  <!-- <div class="floating-panel">
  </div> -->
  <Toaster position="top-center" :duration="1000" />
  <template v-if="isDev">
    <button class="debug-toggle-btn" @click="toggleDebug">
      {{ showDebug ? 'Hide Debug' : 'Show Debug' }}
    </button>
  </template>

  <component :is="DebugHome" v-if="showDebug && DebugHome" />
</template>

<style scoped>
.debug-toggle-btn {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 8px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10001;
}

.debug-toggle-btn:hover {
  background: #5568d3;
}
</style>
