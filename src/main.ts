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
} from './llm/judge';
import { initRouteListener, type HookFunc, type Flow } from './lib/pipeline';

// Helper function to check if response is SSE
function isSSE(flow: Flow): boolean {
  return flow.response.headers.some(h => {
    const [key, value] = h;
    return key.toLowerCase() === 'content-type' && value.includes('text/event-stream');
  });
}

// Helper function to parse response data
function parseResponseData(data: any): any | null {
  try {
    // Handle buffer or string
    const text = typeof data === 'string' ? data : (data.text || data.toString('utf-8'));
    return typeof text === 'string' ? JSON.parse(text) : data;
  } catch {
    return null;
  }
}

// Dashboard state - shared with Dashboard.vue for data passing
export const dashboardData = ref<{
  type: string;
  data: unknown;
  flow?: Flow;
  platform?: 'openai' | 'claude' | 'gemini';
  view?: 'request' | 'response' | 'sse' | 'raw';
} | null>(null);

// Hook function for processing LLM requests/responses
const handleLLMData: HookFunc = async (type, text, flow) => {
  logger.debug('Detected request/response', { type, text: !!text, flow });

  try {
    let platform: 'openai' | 'claude' | 'gemini' | null = null;
    let view: 'request' | 'response' | 'sse' | 'raw' = 'raw';

    // Parse the response data
    const data = parseResponseData(text);

    // Detect platform and view type
    if (isOpenAIReq(type, data, flow)) {
      platform = 'openai';
      view = 'request';
      toast('OpenAI Request detected');
    } else if (isOpenAIRes(type, data, flow)) {
      platform = 'openai';
      if (isSSE(flow)) {
        view = 'sse';
        toast('OpenAI SSE detected');
      } else {
        view = 'response';
        toast('OpenAI Response detected');
      }
    } else if (isAnthropicReq(type, data, flow)) {
      platform = 'claude';
      view = 'request';
      toast('Claude Request detected');
    } else if (isAnthropicRes(type, data, flow)) {
      platform = 'claude';
      if (isSSE(flow)) {
        view = 'sse';
        toast('Claude SSE detected');
      } else {
        view = 'response';
        toast('Claude Response detected');
      }
    } else if (isGeminiReq(type, data, flow)) {
      platform = 'gemini';
      view = 'request';
      toast('Gemini Request detected');
    } else if (isGeminiRes(type, data, flow)) {
      platform = 'gemini';
      if (isSSE(flow)) {
        view = 'sse';
        toast('Gemini SSE detected');
      } else {
        view = 'response';
        toast('Gemini Response detected');
      }
    }

    if (platform && data) {
      dashboardData.value = {
        type,
        data,
        flow,
        platform,
        view
      };
      logger.info('Dashboard data updated', { platform, view });
    } else {
      logger.warn('Unknown type or no data', { type, hasData: !!data });
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
