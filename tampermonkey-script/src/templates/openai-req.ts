import { html } from 'lit-html'
import { css } from './css'
import { renderMarkdown, renderToolMessage } from './utils';


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

      <!-- Basic Info区域 -->
      <details open class="section">
        <summary class="section-header">
          <span class="section-title">Basic Info</span>
        </summary>
        <div class="section-content">
          ${obj.model ? html`
            <div class="info-item">
              <div class="info-label">model</div>
              <div class="info-value">${obj.model}</div>
            </div>
          ` : ''}
          ${obj.temperature !== undefined ? html`
            <div class="info-item">
              <div class="info-label">Temperature</div>
              <div class="info-value">${obj.temperature}</div>
            </div>
          ` : ''}
          ${obj.max_tokens ? html`
            <div class="info-item">
              <div class="info-label">Max Tokens</div>
              <div class="info-value">${obj.max_tokens}</div>
            </div>
          ` : ''}
          ${obj.top_p !== undefined ? html`
            <div class="info-item">
              <div class="info-label">Top P</div>
              <div class="info-value">${obj.top_p}</div>
            </div>
          ` : ''}
          ${obj.frequency_penalty !== undefined ? html`
            <div class="info-item">
              <div class="info-label">Frequency Penalty</div>
              <div class="info-value">${obj.frequency_penalty}</div>
            </div>
          ` : ''}
          ${obj.presence_penalty !== undefined ? html`
            <div class="info-item">
              <div class="info-label">Presence Penalty</div>
              <div class="info-value">${obj.presence_penalty}</div>
            </div>
          ` : ''}
          ${obj.stream !== undefined ? html`
            <div class="info-item">
              <div class="info-label">Stream</div>
              <div class="info-value">${obj.stream ? 'true' : 'false'}</div>
            </div>
          ` : ''}
          ${obj.n ? html`
            <div class="info-item">
              <div class="info-label">n</div>
              <div class="info-value">${obj.n}</div>
            </div>
          ` : ''}
        </div>
      </details>

      <!-- Messages区域 -->
      <details open class="section">
        <summary class="section-header">
          <span class="section-title">
            Messages
            ${obj.messages?.length ? html`<span>(${obj.messages.length})</span>` : ''}
          </span>
        </summary>
        <div class="section-content">
          ${!obj.messages?.length ? html`
            <div class="empty-state">no messages</div>
          ` : html`
            ${obj.messages.map((message: any, index: number) => html`
              <details open class="message-item">
                <summary class="message-header">
                  <div style="display: flex; align-items: center; gap: 8px">
                    <span
                      class="role-badge ${message.role === 'user' ? 'role-user' : message.role === 'assistant' ? 'role-assistant' : message.role === 'system' ? 'role-system' : message.role === 'tool' ? 'role-tool' : ''}"
                    >
                      ${message.role}
                    </span>
                    <span style="font-size: 0.8rem">Message ${index + 1}</span>
                  </div>
                </summary>
                <div class="message-content">
                  ${message.role === "tool" ?
    html`<div class="prose">${renderToolMessage(message.content)}</div>` :
    typeof message.content === "string" ?
      html`<div class="prose">${renderMarkdown(message.content)}</div>` :
      html`<div class="json-content">${JSON.stringify(message.content, null, 2)}</div>`
  }
                </div>
              </details>
            `)}
          `}
        </div>
      </details>

      <!-- Tools区域 -->
      ${obj.tools?.length > 0 ? html`
        <details open class="section">
          <summary class="section-header">
            <span class="section-title">
              Tools
              <span>(${obj.tools.length})</span>
            </span>
          </summary>
          <div class="section-content">
            ${obj.tools.map((tool: any, index: number) => html`
              <details open class="tool-item">
                <summary class="tool-header">
                  <div style="display: flex; align-items: center; gap: 8px">
                    <span class="tool-name-badge">
                      ${tool.function?.name || `Tool ${index + 1}`}
                    </span>
                  </div>
                </summary>
                <div class="tool-content">
                  ${!tool.function ?
      html`<div class="json-content">${JSON.stringify(tool, null, 2)}</div>` :
      html`
                      ${tool.function.description ?
          html`<div class="tool-description prose">${renderMarkdown(tool.function.description)}</div>` :
          ''}
                      ${tool.function.parameters?.properties ?
          html`
                          <div class="tool-parameters">
                            <div class="tool-parameters-title">parameters:</div>
                            ${Object.entries(tool.function.parameters.properties).map(([name, param]: [string, any]) => {
            const required = tool.function.parameters.required || [];
            const isRequired = required.includes(name);
            return html`
                                <div class="parameter-item">
                                  <div>
                                    <span class="parameter-name">${name}</span>
                                    ${param.type ? html`<span class="parameter-type">${param.type}</span>` : ''}
                                    ${isRequired ? html`<span class="parameter-required">required</span>` : ''}
                                  </div>
                                  ${param.description ?
                html`<div class="parameter-description">${param.description}</div>` :
                ''}
                                </div>
                              `;
          })}
                          </div>
                        ` :
          ''}
                    `
    }
                </div>
              </details>
            `)}
          </div>
        </details>
      ` : ''}
    </div>

  </body>
</html>
`