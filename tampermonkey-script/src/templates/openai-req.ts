import { html } from 'lit-html'
import { css } from './css'
import { renderChoiceTextContent, renderToolMessage } from './utils';

// 渲染基本信息项目
const renderInfoItem = (label: string, value: any) => {
  if (value === undefined) return '';
  return html`
    <div class="info-item">
      <div class="info-label">${label}</div>
      <div class="info-value">${typeof value === 'boolean' ? (value ? 'true' : 'false') : value}</div>
    </div>
  `;
};

// 渲染消息内容
const renderMessageContent = (message: any) => {
  if (message.role === "tool") {
    return html`<div class="prose">${renderToolMessage(message.content)}</div>`;
  } else if (typeof message.content === "string") {
    return html`<div class="prose">${renderChoiceTextContent(message.content)}</div>`;
  } else {
    return html`<div class="json-content">${JSON.stringify(message.content, null, 2)}</div>`;
  }
};

// 渲染单个消息
const renderMessage = (message: any, index: number) => {
  const roleClass = `role-${message.role}`;
  return html`
    <details open class="message-item">
      <summary class="message-header">
        <div style="display: flex; align-items: center; gap: 8px">
          <span class="role-badge ${roleClass}">${message.role}</span>
          <span style="font-size: 0.8rem">Message ${index + 1}</span>
        </div>
      </summary>
      <div class="message-content">
        ${renderMessageContent(message)}
      </div>
    </details>
  `;
};

// 渲染参数项
const renderParameterItem = (name: string, param: any, required: any[] = []) => {
  const isRequired = required.includes(name);
  return html`
    <div class="parameter-item">
      <div>
        <span class="parameter-name">${name}</span>
        ${param.type ? html`<span class="parameter-type">${param.type}</span>` : ''}
        ${isRequired ? html`<span class="parameter-required">required</span>` : ''}
      </div>
      ${param.description ? html`<div class="parameter-description">${param.description}</div>` : ''}
    </div>
  `;
};

// 渲染工具内容
const renderToolContent = (tool: any, index: number) => {
  if (!tool.function) {
    return html`<div class="json-content">${JSON.stringify(tool, null, 2)}</div>`;
  }

  return html`
    ${tool.function.description ?
      html`<div class="tool-description prose">${renderChoiceTextContent(tool.function.description)}</div>` :
      ''}
    ${tool.function.parameters?.properties ?
      html`
        <div class="tool-parameters">
          <div class="tool-parameters-title">parameters:</div>
          ${Object.entries(tool.function.parameters.properties).map(([name, param]) =>
        renderParameterItem(name, param, tool.function.parameters.required || [])
      )}
        </div>
      ` :
      ''}
  `;
};

// 渲染单个工具
const renderTool = (tool: any, index: number) => {
  return html`
    <details open class="tool-item">
      <summary class="tool-header">
        <div style="display: flex; align-items: center; gap: 8px">
          <span class="tool-name-badge">
            ${tool.function?.name || `Tool ${index + 1}`}
          </span>
        </div>
      </summary>
      <div class="tool-content">
        ${renderToolContent(tool, index)}
      </div>
    </details>
  `;
};

// 渲染基本信息区域
const renderBasicInfo = (obj: any) => {
  return html`
    <details open class="section">
      <summary class="section-header">
        <span class="section-title">Basic Info</span>
      </summary>
      <div class="section-content">
        ${renderInfoItem('model', obj.model)}
        ${renderInfoItem('Temperature', obj.temperature)}
        ${renderInfoItem('Max Tokens', obj.max_tokens)}
        ${renderInfoItem('Top P', obj.top_p)}
        ${renderInfoItem('Frequency Penalty', obj.frequency_penalty)}
        ${renderInfoItem('Presence Penalty', obj.presence_penalty)}
        ${renderInfoItem('Stream', obj.stream)}
        ${renderInfoItem('n', obj.n)}
      </div>
    </details>
  `;
};

// 渲染消息区域
const renderMessages = (messages = []) => {
  return html`
    <details open class="section">
      <summary class="section-header">
        <span class="section-title">
          Messages
          ${messages.length ? html`<span>(${messages.length})</span>` : ''}
        </span>
      </summary>
      <div class="section-content">
        ${!messages.length ?
      html`<div class="empty-state">no messages</div>` :
      html`${messages.map((message, index) => renderMessage(message, index))}`
    }
      </div>
    </details>
  `;
};

// 渲染prompt字符串
const renderPrompt = (prompt: string) => {
  if (!prompt) return '';

  return html`
    <details open class="section">
      <summary class="section-header">
        <span class="section-title">Prompt</span>
      </summary>
      <div class="section-content">
        <div class="message-content">${renderChoiceTextContent(prompt)}</div>
      </div>
    </details>
  `;
};

// 渲染工具区域
const renderTools = (tools = []) => {
  if (tools.length === 0) return '';

  return html`
    <details open class="section">
      <summary class="section-header">
        <span class="section-title">
          Tools
          <span>(${tools.length})</span>
        </span>
      </summary>
      <div class="section-content">
        ${tools.map((tool, index) => renderTool(tool, index))}
      </div>
    </details>
  `;
};

export const openai_req_template = (obj: any) => html`<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenAI API Request Visualizer</title>
    ${css}
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>OpenAI API Request</h1>
        <p></p>
      </div>

      ${renderBasicInfo(obj)}
      ${obj.messages ? renderMessages(obj.messages) : ''}
      ${obj.prompt ? renderPrompt(obj.prompt) : ''}
      ${renderTools(obj.tools)}
    </div>
  </body>
</html>`;
