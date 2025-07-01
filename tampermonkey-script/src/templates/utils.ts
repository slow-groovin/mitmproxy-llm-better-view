import { html, HTMLTemplateResult } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { marked } from "marked";

export function renderChoiceTextContent(content?: string) {
  if (!content) {
    return ''
  }
  content = content.trim();
  let isMarkdown = content.startsWith('#') || content.startsWith('```') || content.startsWith('---');
  if (!isMarkdown) {
    return html`<div style="white-space: pre; font-family: monospace; overflow-x: auto;">${content}</div>`;
  }

  return unsafeHTML(marked.parse(content) as string)
}
export function renderToolMessage(content: string) {
  try {
    const toolArr = JSON.parse(content)
    const htmls = toolArr.map((toolObj: any) => {
      if (toolObj.type === 'text') {
        return renderChoiceTextContent(toolObj.text)
      }
      return html`<div  style="white-space: pre; font-family: monospace;">${content}</div>`
    })
    return joinedWithHr(htmls)


  } catch (e) {

  }

  return html`<div  style="white-space: pre; font-family: monospace;">${content}</div>`
}

export function renderToolChoiceArgument(_arguments: string) {
  try {
    const toolObj = JSON.parse(_arguments)
    return html`<div class="json-content"><pre>${JSON.stringify(toolObj, null, 2)}</pre></div>`

  } catch (e) {

  }

  return html`<div  style="white-space: pre; font-family: monospace;">${_arguments}</div>`
}

export const joinedWithHr = (sections: HTMLTemplateResult[]) => sections.flatMap((section, index, arr) =>
  index < arr.length - 1
    ? [section, html`<hr />`]  // 每段后面加 <hr>
    : [section]                // 最后一段后面不加
);