import { html } from 'lit-html'
import { css } from './css'
import { renderMarkdown, renderToolMessage } from './utils';

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

      <!-- Basic Info Section -->
      <details open class="section">
        <summary class="section-header">
          <span class="section-title">Basic Info</span>
        </summary>
        <div class="section-content">
          ${obj.id ? html`
            <div class="info-item">
              <div class="info-label">Response ID</div>
              <div class="info-value">${obj.id}</div>
            </div>
          ` : ''}
          ${obj.object ? html`
            <div class="info-item">
              <div class="info-label">Object Type</div>
              <div class="info-value">${obj.object}</div>
            </div>
          ` : ''}
          ${obj.created ? html`
            <div class="info-item">
              <div class="info-label">Created</div>
              <div class="info-value">${new Date(obj.created * 1000).toLocaleString('en-US')}</div>
            </div>
          ` : ''}
          ${obj.model ? html`
            <div class="info-item">
              <div class="info-label">Model</div>
              <div class="info-value">${obj.model}</div>
            </div>
          ` : ''}
          ${obj.system_fingerprint ? html`
            <div class="info-item">
              <div class="info-label">System Fingerprint</div>
              <div class="info-value">${obj.system_fingerprint}</div>
            </div>
          ` : ''}
        </div>
      </details>

      <!-- Token Usage Section -->
      ${obj.usage ? html`
        <details open class="section">
          <summary class="section-header">
            <span class="section-title">Token Usage</span>
          </summary>
          <div class="section-content">
            <div class="usage-grid">
              ${obj.usage.prompt_tokens ? html`
                <div class="usage-item">
                  <div class="usage-label">Prompt Tokens</div>
                  <div class="usage-value">${obj.usage.prompt_tokens}</div>
                </div>
              ` : ''}
              ${obj.usage.completion_tokens ? html`
                <div class="usage-item">
                  <div class="usage-label">Completion Tokens</div>
                  <div class="usage-value">${obj.usage.completion_tokens}</div>
                </div>
              ` : ''}
              ${obj.usage.total_tokens ? html`
                <div class="usage-item">
                  <div class="usage-label">Total Tokens</div>
                  <div class="usage-value">${obj.usage.total_tokens}</div>
                </div>
              ` : ''}
              ${obj.usage.prompt_tokens_details?.cached_tokens ? html`
                <div class="usage-item">
                  <div class="usage-label">Cached Tokens</div>
                  <div class="usage-value">${obj.usage.prompt_tokens_details.cached_tokens}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </details>
      ` : ''}

      <!-- Choices Section -->
      <details open class="section">
        <summary class="section-header">
          <span class="section-title">
            Choices
            ${obj.choices?.length ? html`<span>(${obj.choices.length})</span>` : ''}
          </span>
        </summary>
        <div class="section-content">
          ${!obj.choices?.length ? html`
            <div class="empty-state">No choices available</div>
          ` : html`
            ${obj.choices.map((choice: any, index: number) => html`
              <details open class="choice-item">
                <summary class="choice-header">
                  <div style="display: flex; align-items: center; gap: 8px">
                    <span class="choice-badge">Choice ${index + 1}</span>
                    <span
                      class="finish-reason-badge ${choice.finish_reason === 'stop' ? 'finish-stop' :
    choice.finish_reason === 'length' ? 'finish-length' :
      choice.finish_reason === 'tool_calls' ? 'finish-tool-calls' :
        choice.finish_reason === 'content_filter' ? 'finish-content-filter' : ''}"
                    >
                      ${choice.finish_reason || 'unknown'}
                    </span>
                  </div>
                </summary>
                <div class="choice-content">
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
                  
                  <!-- Message Content -->
                  ${choice.message?.content ? html`
                    <div class="prose">
                      ${typeof choice.message.content === "string" ?
      renderMarkdown(choice.message.content) :
      html`<div class="json-content">${JSON.stringify(choice.message.content, null, 2)}</div>`
    }
                    </div>
                  ` : ''}
                  
                  <!-- Tool Calls -->
                  ${choice.message?.tool_calls?.length ? html`
                    <div class="tool-calls-container">
                      <h4 style="margin-bottom: 8px; font-size: 0.9rem; color: #1e293b;">Tool Calls:</h4>
                      ${choice.message.tool_calls.map((toolCall: any, toolIndex: number) => html`
                        <details open class="tool-call-item">
                          <summary class="tool-call-header">
                            <div>
                              <div class="tool-call-name">${toolCall.function?.name || 'Unknown Function'}</div>
                              <div class="tool-call-id">ID: ${toolCall.id || 'N/A'}</div>
                            </div>
                          </summary>
                          <div class="tool-call-content">
                            <div class="json-content">
                              ${JSON.stringify(
      toolCall.function?.arguments ?
        JSON.parse(toolCall.function.arguments) :
        {},
      null,
      2
    )}
                            </div>
                          </div>
                        </details>
                      `)}
                    </div>
                  ` : ''}

                  <!-- Log Probs (if available) -->
                  ${choice.logprobs ? html`
                    <div style="margin-top: 12px;">
                      <h4 style="margin-bottom: 8px; font-size: 0.9rem; color: #1e293b;">Log Probabilities:</h4>
                      <div class="json-content">${JSON.stringify(choice.logprobs, null, 2)}</div>
                    </div>
                  ` : ''}
                </div>
              </details>
            `)}
          `}
        </div>
      </details>
    </div>
  </body>
</html>
`
