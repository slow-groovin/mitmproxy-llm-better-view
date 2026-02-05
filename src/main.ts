import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { logger } from './lib/logtape';
import './style.css';

// Type guards for LLM request/response detection
logger.debug`main.ts`;
// Helper function to check if response is SSE

// Mount main app
const app = document.createElement('div');
document.body.appendChild(app);
createApp(App).use(createPinia()).mount(app);
