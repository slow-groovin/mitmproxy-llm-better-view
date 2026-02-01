import { createApp } from 'vue';
import './style.css';
import App from './App.vue';


import { initRouteListener } from './lib/pipeline';
import type { Flow } from './lib/pipeline';

initRouteListener(async (type, data, flow) => {

  if (!isOpenaiFlow(flow)) {
    console.log("NOT openai")
    return null;
  }
  const isLLMReq = isLLMRequest(data.text ? JSON.parse(data.text) : data)
  const isLLMRes = isLLMResponse(data.text ? JSON.parse(data.text) : data)
  console.log('isLLMReq', isLLMReq, 'isLLMRes', isLLMRes)

  return null;
});



const app = document.createElement('div');
document.body.appendChild(app);
createApp(App).mount(app);






function isOpenaiFlow(flow: Flow): boolean {
  return flow.request.path.endsWith('/completions');
}

function isLLMRequest(parsedObj: any): boolean {
  return (!!parsedObj) && (!!parsedObj['messages'] || !!parsedObj['prompt']) && (!!parsedObj['model']);
}

function isLLMResponse(parsedObj: any): boolean {
  return (!!parsedObj) && (!!parsedObj['choices']) && (!!parsedObj['model']);
}
