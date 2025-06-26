import { unsafeWindow } from '$';
import { OpenAISSEEvent, processSSEEvents } from './sse';
import { openai_req_template, openai_res_template, openai_res_sse_template } from './templates';
const originalFetch = unsafeWindow.fetch;
let iframeElement: HTMLElement
listenFetch()


/**
 * 当点击某个Flow以及Respnse/Request标签时, mitmweb会发送一个后台api请求获取flow的内容,
 * 拦截这个请求, 对大模型请求中的请求body/响应body渲染对应的页面
 */
async function listenFetch() {
    unsafeWindow.fetch = async (...args) => {
        const [input, init] = args
        const response = await originalFetch(...args);
        const url = input.toString();
        const isFlowContent = url.includes('content/Auto.json') || input.toString().includes('content/auto.json')

        //only handle content/auto.json mitmproxy request
        if (!isFlowContent) {
            return response
        }


        const cloneResp = response.clone()

        if (url.includes("/request/content/")) {
            handleFlowRequest(cloneResp, args)
        } else if (url.includes("/response/content/")) {
            handleFlowResponse(cloneResp, args)
        }
        clearIFrameElement()

        return response;
    };
}

/**
 * 渲染大模型请求Flow中的Request Body
 */
async function handleFlowRequest(resp: Response, rawRequest: Parameters<typeof fetch>) {
    const json = await resp.json()
    if (!json.text) {
        console.warn("response has no text field.")
    }
    let parsedObj: any
    try {
        parsedObj = JSON.parse(json.text)
    } catch (e: any) {
        if (e instanceof SyntaxError) {
            console.debug("try fetch full line of this flow", rawRequest[0])
            const newJson = await reFetchFullLineOfFlow(rawRequest)
            parsedObj = JSON.parse(newJson.text)
        } else {
            console.error('error when parsing `text` in response json', e.name)
            return
        }
    }

    if (!isLLMRequest(parsedObj)) {
        return
    }

    const html = await generateHtmlForOpenaiRequestBody(parsedObj)
    createIFrameElement(html)
}

/**
 * 渲染大模型请求Flow中的 Response Body
 * 分别处理 完整JSON响应 和 SSE响应
 */
async function handleFlowResponse(resp: Response, rawRequest: Parameters<typeof fetch>) {
    // 读取 response 内容
    let json = await await reFetchFullLineOfFlow(rawRequest);
    let html = ''
    if (json.view_name === "JSON") {
        const parsedObj = JSON.parse(json.text);
        // 判断是否为 LLM 响应
        if (!parsedObj || !parsedObj['model'] || !parsedObj['choices']) {
            return;
        }
        html = await generateHtmlForOpenaiResponseBody(parsedObj);
    } else {
        html = await generateHtmlForOpenaiSSE(json.text);
    }

    createIFrameElement(html);
}

/**
 * 生成 OpenAI JSON 响应的 HTML
 */
async function generateHtmlForOpenaiResponseBody(body: any): Promise<string> {
    // 读取HTML模板
    let template = openai_res_template;

    // 直接用结构化 JSON 字符串替换
    const bodyStr = JSON.stringify(body, null, 2);
    const html = template.replace('OPENAI_RESPONSE_BODY_PLACEHOLDER', bodyStr);

    return html;
}

async function generateHtmlForOpenaiSSE(sseText: string): Promise<string> {
    // 解析 events
    const events: any[] = [];
    console.log('sseText', sseText)
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
    console.log('input', input)
    const html = openai_res_sse_template(input);

    return html;
}

async function reFetchFullLineOfFlow(rawRequest: Parameters<typeof fetch>) {
    const [input, init] = rawRequest
    const newInput = input.toString().replace(/\?lines=\d+/, "")
    const newResp = await originalFetch(newInput, init)
    const newJson = await newResp.json()
    return newJson
}




function isLLMRequest(parsedObj: any): boolean {
    return (!!parsedObj) && (!!parsedObj['messages']) && (!!parsedObj['model'])

}
/**
 * 
 * @param body openai api request 中的 body
 * @returns 一个可嵌入页面的HTML字符串，展示body内容
 */
async function generateHtmlForOpenaiRequestBody(body: any): Promise<string> {
    // 读取HTML模板
    let template = openai_req_template;

    // 将body转换为字符串并替换占位符
    const bodyStr = JSON.stringify(body, null, 2);

    const html = template.replace('OPENAI_REQUEST_BODY_PLACEHOLDER', bodyStr);

    return html;
}


async function createIFrameElement(html: string) {
    // 获取容器元素
    const container = document.querySelector('.contentview')
    if (!container) {
        console.warn("no `.contentView` element found")
        return
    }

    const secondChild = container.childNodes[1]

    // 创建 Blob 对象，指定 MIME 类型为 text/html
    const blob = new Blob([html], { type: 'text/html' });

    // 生成临时的 URL
    const blobUrl = URL.createObjectURL(blob);

    // 获取 iframe 元素
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%'
    // 设置样式，让它像内置元素一样
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.width = '100%';

    iframe.style.display = 'block';
    iframe.style.background = 'transparent';

    // 监听iframe加载完成事件，调整高度
    iframe.onload = function () {
        try {
            const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
            const height = iframeDocument?.documentElement.scrollHeight;
            iframe.style.height = height + 'px';
        } catch (e) {
            console.warn(e);
        }
        // 添加全局点击事件到 iframe 内部
        iframe.contentWindow?.document.addEventListener('click', (e) => {
            setTimeout(() => {
                try {
                    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
                    const height = iframeDocument?.documentElement.offsetHeight;
                    iframe.style.height = height + 'px';
                } catch (e) {
                    console.warn(e);
                }
            }, 500)
        });
    };

    // 如果你想禁止滚动条，也可以尝试设置属性（兼容旧浏览器）
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.src = blobUrl;
    container.insertBefore(iframe, secondChild)

    iframeElement = iframe
}

async function clearIFrameElement() {
    iframeElement?.remove()
}

