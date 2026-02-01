import { html } from 'lit-html'
import { css } from './css'
import { renderChoiceTextContent, renderToolChoiceArgument } from './utils';

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

// 渲染使用量项目
const renderUsageItem = (label: string, value: any) => {
  if (value === undefined) return '';
  return html`
    <div class="usage-item">
      <div class="usage-label">${label}</div>
      <div class="usage-value">${value}</div>
    </div>
  `;
};

// 渲染基本信息区域
const renderBasicInfo = (obj: any) => {
  const createdDate = obj.created ? new Date(obj.created * 1000).toLocaleString('en-US') : undefined;

  return html`
    <details open class="section">
      <summary class="section-header">
        <span class="section-title">Basic Info</span>
      </summary>
      <div class="section-content">
        ${renderInfoItem('Response ID', obj.id)}
        ${renderInfoItem('Object Type', obj.object)}
        ${renderInfoItem('Created', createdDate)}
        ${renderInfoItem('Model', obj.model)}
        ${renderInfoItem('System Fingerprint', obj.system_fingerprint)}
      </div>
    </details>
  `;
};

// 渲染Token使用情况区域
const renderTokenUsage = (usage: any) => {
  if (!usage) return '';

  return html`
    <details open class="section">
      <summary class="section-header">
        <span class="section-title">Token Usage</span>
      </summary>
      <div class="section-content">
        <div class="usage-grid">
          ${renderUsageItem('Prompt Tokens', usage.prompt_tokens)}
          ${renderUsageItem('Completion Tokens', usage.completion_tokens)}
          ${renderUsageItem('Total Tokens', usage.total_tokens)}
          ${renderUsageItem('Cached Tokens', usage.prompt_tokens_details?.cached_tokens)}
        </div>
      </div>
    </details>
  `;
};

// 渲染单个工具调用
const renderToolCall = (toolCall: any, _index: number) => {
  const parsedArguments = toolCall.function?.arguments ?
    JSON.parse(toolCall.function.arguments) : {};

  return html`
    <details open class="tool-call-item">
      <summary class="tool-call-header">
        <div>
          <div class="tool-call-name">${toolCall.function?.name || 'Unknown Function'}</div>
          <div class="tool-call-id">ID: ${toolCall.id || 'N/A'}</div>
        </div>
      </summary>
      <div class="tool-call-content">
        ${renderToolChoiceArgument(parsedArguments)}
      </div>
    </details>
  `;
};

// 渲染工具调用列表
const renderToolCalls = (toolCalls: any[]) => {
  if (!toolCalls?.length) return '';

  return html`
    <div class="tool-calls-container">
      <h4 style="margin-bottom: 8px; font-size: 0.9rem; color: #1e293b;">Tool Calls:</h4>
      ${toolCalls.map((toolCall, index) => renderToolCall(toolCall, index))}
    </div>
  `;
};

// 渲染日志概率
const renderLogProbs = (logprobs: any) => {
  if (!logprobs) return '';

  return html`
    <div style="margin-top: 12px;">
      <h4 style="margin-bottom: 8px; font-size: 0.9rem; color: #1e293b;">Log Probabilities:</h4>
      <div class="json-content">${JSON.stringify(logprobs, null, 2)}</div>
    </div>
  `;
};

// 渲染选择元信息
const renderChoiceMeta = (choice: any) => {
  return html`
    <div class="choice-meta">
      ${choice.index !== undefined ? html`
        <div class="choice-meta-item">
          <span>Index:</span>
          <span>${choice.index}</span>
        </div>
      ` : ''}
      ${choice.logprobs ? html`
        <div class="choice-meta-item">
          <span>Log Probs:</span>
          <span>Available</span>
        </div>
      ` : ''}
    </div>
  `;
};

// 渲染消息内容
const renderChoiceMessageContent = (content: any) => {
  if (!content) return '';

  return html`
    <div class="prose">
      ${typeof content === "string" ?
      renderChoiceTextContent(content) :
      html`<div class="json-content">${JSON.stringify(content, null, 2)}</div>`
    }
    </div>
  `;
};

// 获取结束原因的CSS类名
const getFinishReasonClass = (finishReason: string) => {
  const classMap: { [key: string]: string } = {
    'stop': 'finish-stop',
    'length': 'finish-length',
    'tool_calls': 'finish-tool-calls',
    'content_filter': 'finish-content-filter'
  };
  return classMap[finishReason] || '';
};

// 渲染单个选择
const renderChoice = (choice: any, index: number) => {
  const finishReasonClass = getFinishReasonClass(choice.finish_reason);

  return html`
    <details open class="choice-item">
      <summary class="choice-header">
        <div style="display: flex; align-items: center; gap: 8px">
          <span class="choice-badge">Choice ${index + 1}</span>
          <span class="finish-reason-badge ${finishReasonClass}">
            ${choice.finish_reason || 'unknown'}
          </span>
        </div>
      </summary>
      <div class="choice-content">
        ${renderChoiceMeta(choice)}
        ${renderChoiceMessageContent(choice.message?.content)}
        ${renderToolCalls(choice.message?.tool_calls)}
        ${renderLogProbs(choice.logprobs)}
      </div>
    </details>
  `;
};

// 渲染选择区域
const renderChoices = (choices: any[] = []) => {
  return html`
    <details open class="section">
      <summary class="section-header">
        <span class="section-title">
          Choices
          ${choices.length ? html`<span>(${choices.length})</span>` : ''}
        </span>
      </summary>
      <div class="section-content">
        ${!choices.length ?
      html`<div class="empty-state">No choices available</div>` :
      html`${choices.map((choice, index) => renderChoice(choice, index))}`
    }
      </div>
    </details>
  `;
};

export const openai_res_template = (obj: any) => html`<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenAI API Response Visualizer</title>
    ${css}
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>OpenAI API Response</h1>
      </div>

      ${renderBasicInfo(obj)}
      ${renderTokenUsage(obj.usage)}
      ${renderChoices(obj.choices)}
    </div>
  </body>
</html>`;
