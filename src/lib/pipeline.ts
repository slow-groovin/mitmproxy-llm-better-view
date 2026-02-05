import { unsafeWindow } from '$';
import { CallAction, Flow } from '../types/flow';



export type HookFunc = (type: 'request' | 'response', text: any, flow: Flow) => Promise<DocumentFragment | HTMLElement | null | void>;

const originalFetch = unsafeWindow.fetch;

export function initRouteListener(hook: HookFunc) {
  listenUrlChange(async ({ uuid, action }) => {
    const flow = await getFlow(uuid);
    if (!flow) {
      return;
    }

    const dataUrl = `http://${window.location.host}/flows/${uuid}/${action}/content/Auto.json`;
    const data = await getFlowData(dataUrl);
    
    const node = await hook(action, data, flow);
    
    if (node) {
      insertNodeToPage(node);
    }
  });
}

function insertNodeToPage(node: DocumentFragment | HTMLElement) {
  let container = document.getElementById('mitmproxy-llm-better-view-container') as HTMLElement | null;
  
  if (!container) {
    const contentview = document.querySelector('.contentview');
    if (!contentview) {
      console.warn("no `.contentview` element found");
      return;
    }

    const secondChild = contentview.childNodes[1];
    container = document.createElement('details');
    container.toggleAttribute('open');
    container.id = 'mitmproxy-llm-better-view-container';
    container.classList = 'llm-better-view';
    
    const summaryElement = document.createElement('summary');
    summaryElement.textContent = 'LLM Better View';
    container.prepend(summaryElement);
    
    contentview.insertBefore(container, secondChild);
  }

  while (container.childNodes.length > 1) {
    container.removeChild(container.lastChild!);
  }
  
  container.appendChild(node);
}

function extractFlowInfo(url: string): CallAction | null {
  const regex = /#\/flows\/([0-9a-fA-F\-]{36})\/(request|response)/;
  const match = url.match(regex);

  if (match) {
    const [, uuid, action] = match;
    return { uuid, action: action as 'request' | 'response' };
  }
  return null;
}

function listenUrlChange(hook?: (flow: CallAction) => void) {
  let currentUrl = location.href;

  function onUrlChange() {
    if (location.href !== currentUrl) {
      const flow = extractFlowInfo(location.href);
      if (flow) {
        hook?.(flow);
      }
      currentUrl = location.href;
    }
  }

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onUrlChange();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    onUrlChange();
  };

  window.addEventListener('popstate', onUrlChange);
}

function getFlow(uuid: string): Promise<Flow | null> {
  return originalFetch(`http://${location.host}/flows`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch flow with uuid ${uuid}`);
      }
      return res.json();
    })
    .then((flowArray: Flow[]) => {
      return flowArray.find(flow => flow.id === uuid) || null;
    });
}

function getFlowData(dataUrl: string): Promise<any> {
  return originalFetch(new Request(dataUrl))
    .then(resp => resp.json());
}

