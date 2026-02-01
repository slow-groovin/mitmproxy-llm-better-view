import { createApp } from 'vue';
import './style.css';
import App from './App.vue';


import { initRouteListener,} from './lib/pipeline';
import { isAnthropicReq, isAnthropicRes, isGeminiReq, isGeminiRes, isOpenAIReq, isOpenAIRes } from './llm/judge';
import { toast } from 'vue-sonner';

initRouteListener(async (_type, data, flow) => {
  if(isOpenAIReq(_type,data,flow)){
    toast("Openai req")
  }else if(isOpenAIRes(_type,data,flow)){
    toast("Openai res")
  }else if(isAnthropicReq(_type,data,flow)){
    toast("isAnthropicReq")
  }else if(isAnthropicRes(_type,data,flow)){
    toast("isAnthropic res")
  }else if(isGeminiReq(_type,data,flow)){
    toast("gemini req")
  }else if(isGeminiRes(_type,data,flow)){
    toast("gemini res")
  }

  return null;
});



const app = document.createElement('div');
document.body.appendChild(app);
createApp(App).mount(app);





