import { html } from "lit-html"
import { css } from "./css"
import { renderChoiceTextContent, renderToolChoiceArgument } from "./utils"

// 辅助函数
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString("en-US")
}

const formatJSON = (data: any): string => {
  if (typeof data === "string") return data
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

const getFinishReasonClass = (reason: string): string => {
  const classMap: Record<string, string> = {
    stop: "finish-stop",
    length: "finish-length",
    tool_calls: "finish-tool-calls",
    content_filter: "finish-content-filter"
  }
  return classMap[reason] || ""
}

const renderInfoItem = (label: string, value: any, formatter?: (val: any) => string) => {
  if (!value) return ""
  const displayValue = formatter ? formatter(value) : value
  return html`
    <div class="info-item">
      <div class="info-label">${label}</div>
      <div class="info-value">${displayValue}</div>
    </div>
  `
}

const renderUsageItem = (label: string, value: any) => {
  if (!value) return ""
  return html`
    <div class="usage-item">
      <div class="usage-label">${label}</div>
      <div class="usage-value">${value}</div>
    </div>
  `
}

const renderBasicInfo = (events: any) => html`
  <details open class="section">
    <summary class="section-header">
      <div class="section-title">Basic Info</div>
    </summary>
    <div class="section-content">
      ${renderInfoItem("Model", events.model)}
      ${renderInfoItem("Created", events.created, formatTimestamp)}
      ${renderInfoItem("System Fingerprint", events.system_fingerprint)}
      ${renderInfoItem("Events Count", events.eventCount || 0)}
    </div>
  </details>
`

const renderTokenUsage = (usage: any) => {
  if (!usage) return ""

  return html`
    <details open class="section">
      <summary class="section-header">
        <div class="section-title">Token Usage</div>
      </summary>
      <div class="section-content">
        <div class="usage-grid">
          ${renderUsageItem("Prompt Tokens", usage.prompt_tokens)}
          ${renderUsageItem("Completion Tokens", usage.completion_tokens)}
          ${renderUsageItem("Total Tokens", usage.total_tokens)}
          ${renderUsageItem("Cached Tokens", usage.prompt_tokens_details?.cached_tokens)}
        </div>
      </div>
    </details>
  `
}

const renderToolCall = (toolCall: any, index: number) => html`
  <div class="tool-call-item">
    <div>
      <div class="tool-call-name">${toolCall.function?.name || "Unknown Function"}</div>
      <div class="tool-call-id">ID: ${toolCall.id || "N/A"}</div>
    </div>
    <div class="tool-call-content">
    ${renderToolChoiceArgument(toolCall.function?.arguments || "{}")}
    </div>
  </div>
`

const renderChoiceContent = (choice: any) => {
  const contentHtml = choice.content ? html`
    <div class="content-section">
      <h4>Content:</h4>
      <div class="prose">
        ${typeof choice.content === "string"
      ? renderChoiceTextContent(choice.content)
      : html`<div class="json-content">${formatJSON(choice.content)}</div>`
    }
      </div>
    </div>
  ` : ""

  const toolCallsHtml = choice.tool_calls?.length ? html`
    <div class="tool-calls-container">
      ${choice.tool_calls.map((toolCall: any, index: number) => renderToolCall(toolCall, index))}
    </div>
  ` : ""

  return html`${contentHtml}${toolCallsHtml}`
}

const renderChoice = (choice: any, index: number) => html`
  <details open class="choice-item">
    <summary class="choice-header">
      <div class="choice-meta-item">
        <span class="choice-badge">Choice ${index + 1}</span>
        <span class="finish-reason-badge ${getFinishReasonClass(choice.finish_reason)}">
          ${choice.finish_reason || "unknown"}
        </span>
      </div>
    </summary>
    <div class="choice-content">
      ${renderChoiceContent(choice)}
    </div>
  </details>
`

const renderChoices = (choices: any[]) => html`
  <details open class="section">
    <summary class="section-header">
      <div class="section-title">
        Choices
        ${choices?.length ? html`<span>(${choices.length})</span>` : ""}
      </div>
    </summary>
    <div class="section-content">
      ${!choices?.length
    ? html`<div class="empty-state">No choices available</div>`
    : choices.map((choice, index) => renderChoice(choice, index))
  }
    </div>
  </details>
`

const renderEvent = (event: any, index: number) => html`
  <details open class="event-item">
    <summary class="event-header">
      <div class="event-meta">
        <span class="event-badge">Event ${index + 1}</span>
        <span class="event-type-badge">${event.event || "data"}</span>
        ${event.timestamp ? html`
          <span class="event-timestamp">
            ${new Date(event.timestamp).toLocaleTimeString("en-US")}
          </span>
        ` : ""}
      </div>
    </summary>
    <div class="event-content">
      ${event.data ? html`
        <div class="json-content">${formatJSON(event.data)}</div>
      ` : ""}
    </div>
  </details>
`

const renderEventsTimeline = (events: any[]) => {
  if (!events?.length) return ""

  return html`
    <details open class="section">
      <summary class="section-header">
        <div class="section-title">
          Events Timeline
          <span>(${events.length})</span>
        </div>
      </summary>
      <div class="section-content">
        <div class="events-timeline">
          ${events.map((event, index) => renderEvent(event, index))}
        </div>
      </div>
    </details>
  `
}

// 主模板函数
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
        ${renderBasicInfo(events)}
        ${renderTokenUsage(events.usage)}
        ${renderChoices(events.choices)}
        ${renderEventsTimeline(events.events)}
      </div>
    </div>
  </body>
</html>
`
