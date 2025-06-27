import { html } from "lit-html"
import { css } from "./css"
import { renderMarkdown } from "./utils"

export const openai_res_sse_template = (events: any) => html`<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenAI SSE Response Visualizer</title>
    ${css}
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="event-badge">${events.eventCount || 0} events</div>
        <h1>OpenAI SSE Response</h1>
        <p>Server-Sent Events Response Visualization</p>
      </div>
      <div class="content">
        <!-- Basic Info Section -->
        <details open class="section">
          <summary class="section-header">
            <div class="section-title">
              Basic Info
            </div>
          </summary>
          <div class="section-content">
            ${events.model
    ? html`
              <div class="info-item">
                <div class="info-label">Model</div>
                <div class="info-value">${events.model}</div>
              </div>
            `
    : ""
  }
            ${events.created
    ? html`
              <div class="info-item">
                <div class="info-label">Created</div>
                <div class="info-value">${new Date(events.created * 1000).toLocaleString("en-US")}</div>
              </div>
            `
    : ""
  }
            ${events.system_fingerprint
    ? html`
              <div class="info-item">
                <div class="info-label">System Fingerprint</div>
                <div class="info-value">${events.system_fingerprint}</div>
              </div>
            `
    : ""
  }
            <div class="info-item">
              <div class="info-label">Events Count</div>
              <div class="info-value">${events.eventCount || 0}</div>
            </div>
          </div>
        </details>

        <!-- Token Usage Section -->
        ${events.usage
    ? html`
          <details open class="section">
            <summary class="section-header">
              <div class="section-title">
    
                Token Usage
              </div>
            </summary>
            <div class="section-content">
              <div class="usage-grid">
                ${events.usage.prompt_tokens
        ? html`
                  <div class="usage-item">
                    <div class="usage-label">Prompt Tokens</div>
                    <div class="usage-value">${events.usage.prompt_tokens}</div>
                  </div>
                `
        : ""
      }
                ${events.usage.completion_tokens
        ? html`
                  <div class="usage-item">
                    <div class="usage-label">Completion Tokens</div>
                    <div class="usage-value">${events.usage.completion_tokens}</div>
                  </div>
                `
        : ""
      }
                ${events.usage.total_tokens
        ? html`
                  <div class="usage-item">
                    <div class="usage-label">Total Tokens</div>
                    <div class="usage-value">${events.usage.total_tokens}</div>
                  </div>
                `
        : ""
      }
                ${events.usage.prompt_tokens_details?.cached_tokens
        ? html`
                  <div class="usage-item">
                    <div class="usage-label">Cached Tokens</div>
                    <div class="usage-value">${events.usage.prompt_tokens_details.cached_tokens}</div>
                  </div>
                `
        : ""
      }
              </div>
            </div>
          </details>
        `
    : ""
  }

        <!-- Choices Section -->
        <details open class="section">
          <summary class="section-header">
            <div class="section-title">
              Choices
              ${events.choices?.length ? html`<span>(${events.choices.length})</span>` : ""}
            </div>
          </summary>
          <div class="section-content">
            ${!events.choices?.length
    ? html`
              <div class="empty-state">No choices available</div>
            `
    : html`
              ${events.choices.map(
      (choice: any, index: number) => html`
                <details open class="choice-item">
                  <summary class="choice-header">
                    <div class="choice-meta-item">
                      <span class="choice-badge">Choice ${index + 1}</span>
                      <span class="finish-reason-badge ${choice.finish_reason === "stop"
          ? "finish-stop"
          : choice.finish_reason === "length"
            ? "finish-length"
            : choice.finish_reason === "tool_calls"
              ? "finish-tool-calls"
              : choice.finish_reason === "content_filter"
                ? "finish-content-filter"
                : ""
        }">
                        ${choice.finish_reason || "unknown"}
                      </span>
                    </div>
                  </summary>
                  <div class="choice-content">
                    <!-- Message Content -->
                    ${choice.content
          ? html`
                      <div class="content-section">
                        <h4>Content:</h4>
                        <div class="prose">
                          ${typeof choice.content === "string"
              ? renderMarkdown(choice.content)
              : html`<div class="json-content">${JSON.stringify(choice.content, null, 2)}</div>`
            }
                        </div>
                      </div>
                    `
          : ""
        }
                    
                    <!-- Tool Calls -->
                    ${choice.tool_calls?.length
          ? html`
                      <div class="tool-calls-container">
                        ${choice.tool_calls.map(
            (toolCall: any, toolIndex: number) => html`
                          <div open class="tool-call-item">
                            <div>
                              <div class="tool-call-name">${toolCall.function?.name || "Unknown Function"}</div>
                              <div class="tool-call-id">ID: ${toolCall.id || "N/A"}</div>
                            </div>
                            <div class="tool-call-content">
                              <div class="json-content">${(() => {
                if (!toolCall.function?.arguments) return "{}"
                try {
                  console.log(toolCall)
                  const parsed = JSON.parse(toolCall.function.arguments)
                  return JSON.stringify(parsed, null, 2)
                } catch {
                  return toolCall.function.arguments
                }
              })()}</div>
                            </div>
            </div>
                        `,
          )}
                      </div>
                    `
          : ""
        }
                  </div>
                </details>
              `,
    )}
            `
  }
          </div>
        </details>

        <!-- Events Timeline Section -->
        ${events.events?.length
    ? html`
          <details open class="section">
            <summary class="section-header">
              <div class="section-title">
                Events Timeline
                <span>(${events.events.length})</span>
              </div>
            </summary>
            <div class="section-content">
              <div class="events-timeline">
                ${events.events.map(
      (event: any, index: number) => html`
                  <details open class="event-item">
                    <summary class="event-header">
                      <div class="event-meta">
                        <span class="event-badge">Event ${index + 1}</span>
                        <span class="event-type-badge">${event.event || "data"}</span>
                        ${event.timestamp
          ? html`
                          <span class="event-timestamp">${new Date(event.timestamp).toLocaleTimeString("en-US")}</span>
                        `
          : ""
        }
                      </div>
                    </summary>
                    <div class="event-content">
                      ${event.data
          ? html`
                        <div class="json-content">
                          ${typeof event.data === "string" ? event.data : JSON.stringify(event.data, null, 2)}
                        </div>
                      `
          : ""
        }
                    </div>
                  </details>
                `,
    )}
              </div>
            </div>
          </details>
        `
    : ""
  }
      </div>
    </div>
  </body>
</html>
`
