import { createApp, type Component } from 'vue';
import Dashboard from '../pages/Dashboard.vue';
import { logger } from './logtape';

const CONTAINER_ID = 'mitmproxy-llm-better-view-dash-container';

export type PageInjectorOptions = {
  component?: Component;
  props?: Record<string, any>;
};

/**
 * 初始化页面注入器，将Vue组件挂载到目标容器
 */
export function initPageInjector(options?: PageInjectorOptions) {
  const component = options?.component || Dashboard;
  const props = options?.props || {};
  
  ensureContainer();
  mountVueApp(component, props);
}

/**
 * 确保容器元素存在，不存在则创建
 */
function ensureContainer() {
  if (document.getElementById(CONTAINER_ID)) return;

  const contentview = document.querySelector('.contentview');
  if (!contentview) {
    logger.warn("no `.contentview` element found");
    return;
  }
  
  const container = document.createElement('div');
  container.id = CONTAINER_ID;

  const secondChild = contentview.childNodes[0];
  contentview.insertBefore(container, secondChild);
}

/**
 * 挂载Vue应用到容器
 */
function mountVueApp(component: Component, props: Record<string, any>) {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;


  // 清空容器（保留summary）
  while (container.childNodes.length > 1) {
    container.removeChild(container.lastChild!);
  }
  
  const app = createApp(component, props);
  app.mount(container);
}

/**
 * 销毁页面注入器，清理资源
 */
export function destroyPageInjector() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;


  // 清空容器（保留summary）
  while (container.childNodes.length > 1) {
    container.removeChild(container.lastChild!);
  }

  container.remove();
}

export const initDashboardInjector = initPageInjector;
export const destroyDashboardInjector = destroyPageInjector;