import { GM_addElement, unsafeWindow, GM_addStyle } from '$';
import { render } from 'lit-html';
import { processSSEEvents } from './sse';
import { openai_req_template, } from './templates/openai-req';
import { openai_res_template } from './templates/openai-res';
import { openai_res_sse_template } from './templates/openai-res-sse';
import { CallAction, Flow } from './types';
import { LRUCache, omit } from './utils';
/**

 */

// LRU cache for Flow data to improve performance
const flowKV = new LRUCache<string, Flow>(1024);
// Save the original fetch method for later use
const originalFetch = unsafeWindow.fetch;
// Global iframe element reference
let iframeElement: HTMLIFrameElement
let mutationObservers: { [key: string]: MutationObserver } = {};


GM_addStyle(`
details.llm-better-view {
  border: 1px solid #aaa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.llm-better-view summary {
  font-weight: bold;
  padding: 0.5em;
  display: list-item;
}

details[open].llm-better-view summary {
  border-bottom: 1px solid #aaa;
  margin-bottom: 0.5em;
}

  `)
/**
 * Listen for URL changes and automatically render OpenAI request/response content
 * Entry point for mitmproxy-llm-better-view script.
 * Listens for URL changes in the mitmproxy web interface and renders custom visualizations
 * for OpenAI request/response flows.
 */
listenUrlChange(async ({ uuid, action }) => {
  const flow = await getFlow(uuid)
  if (!flow) {
    return
  }
  if (isOpenaiFlow(flow)) {
    if (action === 'request') {
      await renderOpenaiRequest(uuid)
    } else if (action === 'response') {
      await renderOpenaiResponse(uuid)
    }
  }
})

/**
 * Render OpenAI request body content
 * @param uuid Unique identifier for the Flow
 */
async function renderOpenaiRequest(uuid: string) {
  const json = await getFlowData(`http://${window.location.host}/flows/${uuid}/request/content/Auto.json`)
  if (!json.text) {
    console.warn("response has no text field.")
  }
  let parsedObj: any
  try {
    parsedObj = JSON.parse(json.text)
  } catch (e: any) {
    console.error(e);
  }

  if (!isLLMRequest(parsedObj)) {
    return
  }

  const html = await generateHtmlForOpenaiRequestBody(parsedObj)
  createIFrameElement(html)
}

/**
 * Render OpenAI response body content (supports both JSON and SSE formats)
 * @param uuid Unique identifier for the Flow
 */
async function renderOpenaiResponse(uuid: string) {
  // Read response content
  let json = await await getFlowData(`http://${window.location.host}/flows/${uuid}/response/content/Auto.json`);
  let html = ''
  if (json.view_name === "JSON") {
    const parsedObj = JSON.parse(json.text);
    // Check if it is an LLM response
    if (!isLLMResponse(parsedObj)) {
      return;
    }
    html = await generateHtmlForOpenaiResponseBody(parsedObj);
  } else {
    html = await generateHtmlForOpenaiSSE(json.text);
  }

  createIFrameElement(html);
}

/**
 * Generate HTML string for OpenAI request body
 * @param body The body of the OpenAI API request
 * @returns An embeddable HTML string displaying the body content
 */
async function generateHtmlForOpenaiRequestBody(body: any): Promise<string> {
  // Call the lit-html template function to generate content
  const templateResult = openai_req_template(body);
  // Create a temporary div to render the lit-html template
  const tempDiv = document.createElement('div');
  render(templateResult, tempDiv);
  const html = tempDiv.innerHTML;
  return html;
}

/**
 * Generate HTML string for OpenAI JSON response
 * @param body OpenAI API response JSON
 */
async function generateHtmlForOpenaiResponseBody(body: any) {
  const templateResult = openai_res_template(body);
  // Create a temporary div to render the lit-html template
  const tempDiv = document.createElement('div');
  render(templateResult, tempDiv);
  const html = tempDiv.innerHTML;
  return html;
}

/**
 * Generate HTML string for OpenAI SSE response
 * @param sseText SSE text content
 */
async function generateHtmlForOpenaiSSE(sseText: string): Promise<string> {
  // Parse events
  const events: any[] = [];
  sseText.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('data: ')) {
      const dataContent = line.slice(6);
      if (dataContent === '[DONE]') return;
      try {
        events.push(JSON.parse(dataContent));
      } catch { }
    }
  });
  const input = processSSEEvents(events)
  const templateResult = openai_res_sse_template(input);
  const tempDiv = document.createElement('div');
  render(templateResult, tempDiv);
  const html = tempDiv.innerHTML;
  return html;
}

/**
 * Fetch Flow data from the specified URL
 * @param dataUrl The URL to request
 */
async function getFlowData(dataUrl: string) {
  const newResp = await originalFetch(new Request(dataUrl))
  const newJson = await newResp.json()
  return newJson
}

/**
 * Extract Flow info (uuid and action) from the URL
 * @param url The current page URL
 */
function extractFlowInfo(url: string): CallAction | null {
  const regex = /#\/flows\/([0-9a-fA-F\-]{36})\/(request|response)/;
  const match = url.match(regex);

  if (match) {
    const [, uuid, action] = match;
    return { uuid, action: action as 'request' | 'response' };
  }
  return null;
}

/**
 * Listen for page URL changes and invoke the hook
 * @param hook Callback when the URL changes
 */
async function listenUrlChange(hook?: (flow: CallAction) => void) {
  // Record the current URL
  let currentUrl = location.href;

  // General function: triggered when the URL changes
  function onUrlChange() {
    if (location.href !== currentUrl) {
      const flow = extractFlowInfo(location.href)
      if (flow) {
        hook?.(flow)
      }
      currentUrl = location.href;
      // Place your logic here
    }
  }
  // Hijack pushState and replaceState
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

  // Listen for popstate event (browser forward/back)
  window.addEventListener('popstate', onUrlChange);
}

/**
 * Determine if a Flow is an OpenAI chat/completions request
 * @param flow Flow object
 */
function isOpenaiFlow(flow: Flow): boolean {
  return flow.request.path.endsWith('/completions')

}
/**
 * Get Flow data from LRU cache or API
 * @param uuid Unique identifier for the Flow
 */
async function getFlow(uuid: string): Promise<Flow | null> {
  const cacheKey = `mitmproxy-flow-${uuid}`;
  let cachedFlow = flowKV.get(cacheKey);
  if (cachedFlow) {
    return cachedFlow;
  }

  // If not in cache, fetch from API
  const response = await originalFetch(`http://${location.host}/flows`);

  if (!response.ok) {
    throw new Error(`Failed to fetch flow with uuid ${uuid}`);
  }
  const flowArray: Flow[] = await response.json();
  let targetFlow: Flow | null = null
  for (const flow of flowArray) {
    if (isOpenaiFlow(flow)) {
      flowKV.put(flow.id, omit<any, string>(flow, ['client_conn', 'server_conn']) as Flow)
    }
    if (flow.id === uuid) {
      targetFlow = flow
    }
  }
  if (targetFlow) {

    flowKV.put(cacheKey, targetFlow); // Cache the result
  }
  return targetFlow;

}

/**
 * Check if the object is an LLM request body
 * @param parsedObj Request body object
 */
function isLLMRequest(parsedObj: any): boolean {
  return (!!parsedObj) && (!!parsedObj['messages'] || !!parsedObj['prompt']) && (!!parsedObj['model'])
}

/**
 * Check if the object is an LLM response body
 * @param parsedObj Response body object
 */
function isLLMResponse(parsedObj: any): boolean {
  return (!!parsedObj) && (!!parsedObj['choices']) && (!!parsedObj['model'])
}

/**
 * Create and insert an iframe element to display the rendered result
 * @param html The HTML string to embed
 */
async function createIFrameElement(html: string) {
  // Get the container element
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
    container.classList = 'llm-better-view'
    contentview.insertBefore(container, secondChild);
  }

  // Ensure the details element has a summary element
  let summaryElement = Array.from(container.children).find(
    el => el.tagName.toLowerCase() === 'summary'
  ) as HTMLElement | undefined;
  if (!summaryElement) {
    summaryElement = document.createElement('summary');
    summaryElement.textContent = 'LLM Better View'; // You might want to customize this text
    container.prepend(summaryElement); // Add it as the first child
  }



  // Define the function to resize the iframe content
  const resizeIframeContent = () => {
    try {
      const iframeDocument = iframeElement.contentDocument || iframeElement.contentWindow?.document;
      const height = iframeDocument?.documentElement.offsetHeight;
      // console.log("resizing iframe content", iframeDocument?.documentElement.clientHeight, iframeDocument?.documentElement.offsetHeight, iframeDocument?.documentElement.scrollHeight);
      iframeElement.style.height = height + 'px';

    } catch (e) {
      console.warn(e);
    }
  };


  // Disconnect any existing observer and clear existing iframe if any
  // Disconnect all existing MutationObservers and clear them
  for (const observerId in mutationObservers) {
    mutationObservers[observerId].disconnect();
    delete mutationObservers[observerId];
  }
  // Remove existing iframe if present
  if (iframeElement && container.contains(iframeElement)) {
    container.removeChild(iframeElement);
  }

  // Create temporary iframe
  iframeElement = GM_addElement(container, 'iframe', {
    scrolling: 'no',
    frameborder: '0',
    style: 'width: 100%; height: 100%; border: none; overflow: hidden; display: block; background: transparent; ',
    csp: "default-src 'unsafe-eval'  'unsafe-inline' ",
    srcdoc: html,

    // src: blobUrl
  }) as HTMLIFrameElement
  // Listen for iframe load event to adjust height
  iframeElement.onload = () => {
    resizeIframeContent();
    const iframeDocument = iframeElement.contentDocument || iframeElement.contentWindow?.document;
    if (iframeDocument) {
      const observer = new MutationObserver(resizeIframeContent);
      observer.observe(iframeDocument.body, { childList: true, subtree: true, attributes: true });
      const observerId = `${Date.now()}`;
      iframeElement.dataset.mutationObserverId = observerId;
      mutationObservers[observerId] = observer;
    }
  };
  container.appendChild(iframeElement)

}
