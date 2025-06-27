import { html, HTMLTemplateResult } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { marked } from "marked";

export function renderMarkdown(content?: string) {
  return content ? unsafeHTML(marked.parse(content.trim()) as string) : ''
}
export function renderToolMessage(content: string) {
  try {
    const toolArr = JSON.parse(content)
    const htmls = toolArr.map((toolObj: any) => {
      if (toolObj.type === 'text') {
        return renderMarkdown(toolObj.text)
      }
      return html`<div  style="white-space: pre; font-family: monospace;">${content}</div>`
    })
    return joinedWithHr(htmls)


  } catch (e) {

  }

  return html`<div  style="white-space: pre; font-family: monospace;">${content}</div>`
}

export const joinedWithHr = (sections: HTMLTemplateResult[]) => sections.flatMap((section, index, arr) =>
  index < arr.length - 1
    ? [section, html`<hr />`]  // 每段后面加 <hr>
    : [section]                // 最后一段后面不加
);