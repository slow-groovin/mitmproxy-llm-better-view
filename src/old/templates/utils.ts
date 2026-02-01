import { html, HTMLTemplateResult } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { marked } from "marked";

export function renderChoiceTextContent(content?: string) {
  console.log('content', content)
  if (!content) {
    return ''
  }
  content = content.trim();
  let _isJSON = isJSON(content);
  if (_isJSON) {
    return html`<div data-format='text-as-json' style="white-space: pre; font-family: monospace; overflow-x: auto;"><pre>${JSON.stringify(JSON.parse(content), null, 2)}</pre></div>`;
  }

  let isXml = isXmlFragment(content);

  let isMarkdown = content.startsWith('#') || content.includes('\n```') || content.includes('\n# ') || content.includes('\n## ') || content.includes('\n# ') || content.includes('\n### ') || content.includes('\n1. ') || content.includes('\n- ');
  if (isXml && !isMarkdown) {
    return html`<div data-format='xml' style="white-space: pre; font-family: monospace; overflow-x: auto;">${content}</div>`;
  }

  const parsedHtml = marked.use({
    renderer: {
      html({ text }) {
        return `<div data-format='markdown-html' style="white-space: pre; font-family: monospace; overflow-x: auto;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
      }
    }
  }).parse(content) as string
  return unsafeHTML(parsedHtml)

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
  /*
   * 如果已经是object, 直接返回
   */
  if (typeof _arguments === 'object') {
    return html`<div class="json-content"><pre>${JSON.stringify(_arguments, null, 2)}</pre></div>`

  }
  /*
   * 尝试解析为object
   */
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


/**
 * 判断输入的字符串是否为 XML 片段内容
 * @param content 需要判断的字符串
 * @returns 如果是 XML 片段返回 true，否则返回 false
 */
function isXmlFragment(content: string): boolean {
  // 如果内容为空或非字符串类型，直接返回 false
  if (!content || typeof content !== 'string') {
    return false;
  }

  // 去除前后空白
  const trimmedContent = content.trim();

  // 如果处理后内容为空，返回 false
  if (trimmedContent.length === 0) {
    return false;
  }

  // 1. 基本特征检查 - 是否包含尖括号对
  if (!trimmedContent.includes('<') || !trimmedContent.includes('>')) {
    return false;
  }

  // 2. 检查是否以 XML 声明或标签开始
  const startsWithXmlPattern = /^\s*(<\?xml|<[a-zA-Z][a-zA-Z0-9:_.-]*[\s/>])/i;

  // 3. 检查标签平衡 (简化版)
  const hasBalancedTags = (str: string): boolean => {
    // 提取所有标签
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9:_.-]*)[^>]*>/g;
    const matches = [...str.matchAll(tagPattern)];

    if (matches.length === 0) {
      return false;
    }

    // 跟踪开放的标签
    const openTags: string[] = [];

    for (const match of matches) {
      const fullTag = match[0];
      const tagName = match[1];

      // 忽略自闭合标签
      if (fullTag.endsWith('/>')) {
        continue;
      }

      // 检查是否为结束标签
      if (fullTag.startsWith('</')) {
        // 如果没有对应的开始标签，或最近的开始标签与当前结束标签不匹配
        if (openTags.length === 0 || openTags.pop() !== tagName) {
          return false;
        }
      } else {
        // 将开始标签推入栈中
        openTags.push(tagName);
      }
    }

    // 如果所有标签都正确闭合，栈应该为空
    // 注意：某些 XML 片段可能不完整，所以这里我们放宽条件
    return true;
  };

  // 4. 检查是否包含常见 XML 特性
  const hasXmlFeatures = (str: string): boolean => {
    // 检查属性定义
    const hasAttributes = /\s+[a-zA-Z][a-zA-Z0-9:_.-]*\s*=\s*(['"]).*?\1/.test(str);

    // 检查自闭合标签
    const hasSelfClosingTags = /<[^>]+\/\s*>/.test(str);

    // 检查 CDATA 部分
    const hasCData = /<!\[CDATA\[.*?\]\]>/.test(str);

    // 检查注释
    const hasComments = /<!--.*?-->/.test(str);

    // 检查实体引用
    const hasEntityRef = /&[a-zA-Z0-9#]+;/.test(str);

    // 如果至少满足其中一个特征，则可能是 XML
    return hasAttributes || hasSelfClosingTags || hasCData || hasComments || hasEntityRef;
  };

  // 5. 检查是否有嵌套结构
  const hasNestedStructure = /<[^>]*>[^<>]*<[^>]*>/.test(trimmedContent);

  // 组合多个规则进行判断
  // 如果内容以 XML 声明或有效标签开始，且满足以下条件之一，则判断为 XML 片段：
  // - 标签平衡
  // - 包含典型 XML 特性
  // - 具有嵌套结构
  const isStartingWithXml = startsWithXmlPattern.test(trimmedContent);
  const hasBalanced = hasBalancedTags(trimmedContent);
  const hasFeatures = hasXmlFeatures(trimmedContent);

  return isStartingWithXml || (hasBalanced && (hasFeatures || hasNestedStructure));
}

function isJSON(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch (e) {
    return false;
  }
}