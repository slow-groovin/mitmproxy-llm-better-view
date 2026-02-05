import { createApp, type Component } from 'vue';
import Dashboard from '../pages/Dashboard.vue';

let container: HTMLElement | null = null;
let vueAppInstance: any = null;

export type PageInjectorOptions = {
  component?: Component;
};

export function initPageInjector(options?: PageInjectorOptions) {
  const component = options?.component || Dashboard;
  
  ensureContainer();
  mountVueApp(component);
}

function ensureContainer() {
  if (container) {
    return;
  }

  const contentview = document.querySelector('.contentview');
  if (!contentview) {
    console.warn("no `.contentview` element found");
    return;
  }

  const secondChild = contentview.childNodes[1];
  container = document.createElement('details');
  container.toggleAttribute('open');
  container.id = 'mitmproxy-llm-better-view-dash-container';
  container.classList.add('llm-better-view');
  
  const summaryElement = document.createElement('summary');
  summaryElement.textContent = 'LLM Better View Dashboard';
  container.prepend(summaryElement);
  
  contentview.insertBefore(container, secondChild);
}

function mountVueApp(component: Component) {
  if (!container) {
    return;
  }

  if (vueAppInstance) {
    vueAppInstance.unmount();
  }

  const appContainer = document.createElement('div');
  appContainer.id = 'vue-dashboard-mount-point';
  
  while (container.childNodes.length > 1) {
    container.removeChild(container.lastChild!);
  }
  
  container.appendChild(appContainer);

  vueAppInstance = createApp(component);
  vueAppInstance.mount(appContainer);
}

export function destroyPageInjector() {
  if (vueAppInstance) {
    vueAppInstance.unmount();
    vueAppInstance = null;
  }

  if (container) {
    container.remove();
    container = null;
  }
}
