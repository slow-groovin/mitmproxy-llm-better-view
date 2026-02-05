import { createApp, ref } from 'vue';
import './style.css';
import App from './App.vue';
import { toast } from 'vue-sonner';
import { logger } from './lib/logtape';

// Type guards for LLM request/response detection
import {
  isOpenAIReq,
  isOpenAIRes,
  isAnthropicReq,
  isAnthropicRes,
  isGeminiReq,
  isGeminiRes,
  isSSE,
} from './llm/judge';
import { initRouteListener, type HookFunc, type Flow } from './lib/pipeline';
logger.debug`main.ts`;
// Helper function to check if response is SSE



// Hook function for processing LLM requests/responses
const handleLLMData: HookFunc = async (type, flowData, flow) => {
  logger.debug`Detected request/response ${{ type, flowData, flow }}`;
  try {
    let platform: 'openai' | 'claude' | 'gemini' | null = null;
    let view: 'request' | 'response' | 'sse' | 'raw' = 'raw';
    const dataAsText=flowData.text
    // Parse the response data
    // const data = parseResponseData(dataAsText);
    // logger.debug`dataTExt: ${dataAsText}`
    // Detect platform and view type
    if (isOpenAIReq(type, dataAsText, flow)) {
      platform = 'openai';
      view = 'request';
      toast('OpenAI Request detected');
    } else if (isOpenAIRes(type, dataAsText, flow)) {
      platform = 'openai';
      if (isSSE(flow)) {
        view = 'sse';
        toast('OpenAI SSE detected');
      } else {
        view = 'response';
        toast('OpenAI Response detected');
      }
    } else if (isAnthropicReq(type, dataAsText, flow)) {
      platform = 'claude';
      view = 'request';
      toast('Claude Request detected');
    } else if (isAnthropicRes(type, dataAsText, flow)) {
      platform = 'claude';
      if (isSSE(flow)) {
        view = 'sse';
        toast('Claude SSE detected');
      } else {
        view = 'response';
        toast('Claude Response detected');
      }
    } else if (isGeminiReq(type, dataAsText, flow)) {
      platform = 'gemini';
      view = 'request';
      toast('Gemini Request detected');
    } else if (isGeminiRes(type, dataAsText, flow)) {
      platform = 'gemini';
      if (isSSE(flow)) {
        view = 'sse';
        toast('Gemini SSE detected');
      } else {
        view = 'response';
        toast('Gemini Response detected');
      }
    }

    if (platform && dataAsText) {
      // dashboardData.value = {
      //   type,
      //   data,
      //   flow,
      //   platform,
      //   view
      // };
      logger.info('Dashboard data updated', { platform, view });
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

// Mount main app
const app = document.createElement('div');
document.body.appendChild(app);
createApp(App).mount(app);
