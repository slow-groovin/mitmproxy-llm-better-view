export const openai_req_template = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenAI API Request Visualizer</title>
    <script
      defer
      src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          sans-serif;
        color: #000000;
        line-height: 1.5;
        font-size: 14px;
      }

      .container {
        padding: 12px;
        border: 1px solid gray;
        border-radius: 8px;
      }

      .header {
        text-align: center;
        margin-bottom: 16px;
        position: relative;
      }

      .header h1 {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .header p {
        color: #64748b;
        font-size: 0.875rem;
      }

      .global-collapse-btn {
        position: absolute;
        top: 0;
        right: 0;
        background: #e2e8f0;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.75rem;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s;
      }

      .global-collapse-btn:hover {
        background: #cbd5e1;
      }

      .section {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }

      .section-header {
        padding: 10px 12px;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s;
      }

      .section-header:hover {
        background: #e2e8f0;
      }

      .section-title {
        font-weight: 600;
        font-size: 0.95rem;
        color: #1e293b;
      }

      .section-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .expand-collapse-btn {
        background: #dbeafe;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.7rem;
        color: #1d4ed8;
        display: flex;
        align-items: center;
        gap: 2px;
        transition: background-color 0.2s;
      }

      .expand-collapse-btn:hover {
        background: #bfdbfe;
      }

      .expand-collapse-btn.tools {
        background: #f3e8ff;
        color: #7c3aed;
      }

      .expand-collapse-btn.tools:hover {
        background: #e9d5ff;
      }

      .toggle-icon {
        transition: transform 0.2s;
        color: #64748b;
        font-size: 0.75rem;
      }

      .toggle-icon.rotated {
        transform: rotate(180deg);
      }

      .section-content {
        padding: 2px;
      }

      .info-item {
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .info-item:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 500;
        min-width: 120px;
      }

      .info-value {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.8rem;
      }

      .message-item,
      .tool-item {
        border-bottom: 2px solid #7eb4e950;
        padding: 4px 8px;
      }

      .message-item:last-child,
      .tool-item:last-child {
        border-bottom: none;
      }

      .message-header,
      .tool-header {
        padding: 6px 0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .message-header:hover,
      .tool-header:hover {
        background: #f8fafc;
        margin: 0 -12px;
        padding: 6px 12px;
        border-radius: 4px;
      }

      .role-badge {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .role-user {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .role-assistant {
        background: #dcfce7;
        color: #166534;
      }

      .role-system {
        background: #fef3c7;
        color: #92400e;
      }

      .role-tool {
        background: #f3e8ff;
        color: #7c3aed;
      }

      .tool-name-badge {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: initial;
        font-weight: 700;
        text-transform: none;
        background: #f3e8ff;
        color: #7c3aed;
        font-family: "Monaco", "Menlo", monospace;
      }

      .message-content,
      .tool-content {
        padding: 4px 16px;
        font-size: initial;
        background-color: #88bcc515;
        overflow-y: auto;
      }

      .json-content {
        font-family: "Monaco", "Menlo", monospace;
        background: #f8fafc;
        padding: 8px;
        border-radius: 4px;
        white-space: pre-wrap;
        font-size: 0.75rem;
      }

      /* GitHub-style Markdown prose */
      .prose {
        line-height: 1.6;
        color: #24292f;
      }

      .prose h1,
      .prose h2,
      .prose h3,
      .prose h4,
      .prose h5,
      .prose h6 {
        margin-top: 16px;
        margin-bottom: 8px;
        font-weight: 600;
        line-height: 1.25;
      }

      .prose h1 {
        font-size: 1.25em;
        border-bottom: 1px solid #d0d7de;
        padding-bottom: 4px;
      }
      .prose h2 {
        font-size: 1.1em;
        border-bottom: 1px solid #d0d7de;
        padding-bottom: 4px;
      }
      .prose h3 {
        font-size: 1em;
      }
      .prose h4 {
        font-size: 0.9em;
      }
      .prose h5 {
        font-size: 0.85em;
      }
      .prose h6 {
        font-size: 0.8em;
        color: #656d76;
      }

      .prose p {
        margin-top: 0;
        margin-bottom: 8px;
      }

      .prose ul,
      .prose ol {
        margin-top: 0;
        margin-bottom: 8px;
        padding-left: 20px;
      }

      .prose li {
        margin-bottom: 2px;
      }

      .prose blockquote {
        margin: 8px 0;
        padding: 0 12px;
        color: #656d76;
        border-left: 3px solid #d0d7de;
      }

      .prose code {
        background: rgba(175, 184, 193, 0.2);
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 0.85em;
        font-family: "Monaco", "Menlo", "Consolas", monospace;
      }

      .prose pre {
        background: #f6f8fa;
        border-radius: 6px;
        padding: 12px;
        overflow-x: auto;
        margin: 8px 0;
        border: 1px solid #d0d7de;
      }

      .prose pre code {
        background: none;
        padding: 0;
        font-size: 0.8em;
      }

      .prose a {
        color: #0969da;
        text-decoration: none;
      }

      .prose a:hover {
        text-decoration: underline;
      }

      .prose strong {
        font-weight: 600;
      }

      .prose em {
        font-style: italic;
      }

      .prose table {
        border-collapse: collapse;
        margin: 8px 0;
        width: 100%;
      }

      .prose th,
      .prose td {
        border: 1px solid #d0d7de;
        padding: 6px 8px;
        text-align: left;
      }

      .prose th {
        background: #f6f8fa;
        font-weight: 600;
      }

      .tool-description {
        margin: 6px 0;
        font-size: 1rem;
      }

      .tool-parameters {
        margin-top: 8px;
      }

      .tool-parameters-title {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 6px;
      }

      .parameter-item {
        margin-bottom: 8px;
        padding: 6px 8px;
        background: #f8fafc;
        border-radius: 4px;
        border-left: 3px solid #3b82f6;
      }

      .parameter-name {
        font-weight: 600;
        font-size: 0.75rem;
        color: #1e293b;
        font-family: "Monaco", "Menlo", monospace;
      }

      .parameter-type {
        font-size: 0.7rem;
        color: #7c3aed;
        background: #f3e8ff;
        padding: 1px 4px;
        border-radius: 2px;
        margin-left: 6px;
      }

      .parameter-required {
        font-size: 0.65rem;
        color: #dc2626;
        background: #fef2f2;
        padding: 1px 4px;
        border-radius: 2px;
        margin-left: 4px;
      }

      .parameter-description {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 2px;
      }

      .empty-state {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 20px 12px;
        font-size: 0.8rem;
      }

      /* SVG Icons */
      .icon {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }
    </style>
  </head>
  <body>
    <div class="container" x-data="requestVisualizer()">
      <div class="header">
        <button 
          class="global-collapse-btn" 
          @click="toggleGlobalCollapse()"
          :title="globalCollapsed ? 'Expand All' : 'Collapse All'"
        >
          <svg class="icon" viewBox="0 0 24 24" x-show="!globalCollapsed">
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
          </svg>
          <svg class="icon" viewBox="0 0 24 24" x-show="globalCollapsed">
            <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/>
          </svg>
          <span x-text="globalCollapsed ? 'Expand All' : 'Collapse All'"></span>
        </button>
        <h1>OpenAI API Request</h1>
        <p></p>
      </div>

      <!-- Basic Info区域 -->
      <div class="section">
        <div class="section-header" @click="toggleSection('basicInfo')">
          <span class="section-title">Basic Info</span>
          <span class="toggle-icon" :class="{ 'rotated': !collapsed.basicInfo }"
            >▼</span
          >
        </div>
        <div class="section-content" x-show="!collapsed.basicInfo" x-transition>
          <div class="info-item" x-show="requestBody.model">
            <div class="info-label">model</div>
            <div class="info-value" x-text="requestBody.model"></div>
          </div>
          <div class="info-item" x-show="requestBody.temperature !== undefined">
            <div class="info-label">Temperature</div>
            <div class="info-value" x-text="requestBody.temperature"></div>
          </div>
          <div class="info-item" x-show="requestBody.max_tokens">
            <div class="info-label">Max Tokens</div>
            <div class="info-value" x-text="requestBody.max_tokens"></div>
          </div>
          <div class="info-item" x-show="requestBody.top_p !== undefined">
            <div class="info-label">Top P</div>
            <div class="info-value" x-text="requestBody.top_p"></div>
          </div>
          <div
            class="info-item"
            x-show="requestBody.frequency_penalty !== undefined"
          >
            <div class="info-label">Frequency Penalty</div>
            <div
              class="info-value"
              x-text="requestBody.frequency_penalty"
            ></div>
          </div>
          <div
            class="info-item"
            x-show="requestBody.presence_penalty !== undefined"
          >
            <div class="info-label">Presence Penalty</div>
            <div class="info-value" x-text="requestBody.presence_penalty"></div>
          </div>
          <div class="info-item" x-show="requestBody.stream !== undefined">
            <div class="info-label">Stream</div>
            <div
              class="info-value"
              x-text="requestBody.stream ? '是' : '否'"
            ></div>
          </div>
          <div class="info-item" x-show="requestBody.n">
            <div class="info-label">生成数量</div>
            <div class="info-value" x-text="requestBody.n"></div>
          </div>
        </div>
      </div>

      <!-- Messages区域 -->
      <div class="section">
        <div class="section-header" @click="toggleSection('messages')">
          <span class="section-title">
            Messages
            <span
              x-show="requestBody.messages?.length"
              x-text="'(' + requestBody.messages?.length + ')'"
            ></span>
          </span>
          <div class="section-controls">
            <button 
              class="expand-collapse-btn"
              x-show="requestBody.messages?.length > 0 && !collapsed.messages"
              @click.stop="toggleAllMessages()"
              :title="allMessagesExpanded ? 'Collapse All消息' : 'Expand All消息'"
            >
              <svg class="icon" viewBox="0 0 24 24" x-show="allMessagesExpanded">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
              <svg class="icon" viewBox="0 0 24 24" x-show="!allMessagesExpanded">
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
              <span x-text="allMessagesExpanded ? '折叠' : '展开'"></span>
            </button>
            <span class="toggle-icon" :class="{ 'rotated': !collapsed.messages }"
              >▼</span
            >
          </div>
        </div>
        <div class="section-content" x-show="!collapsed.messages" x-transition>
          <template
            x-if="!requestBody.messages?.length"
          >
            <div class="empty-state">暂无消息</div>
          </template>
          <template
            x-for="(message, index) in requestBody.messages"
            :key="index"
          >
            <div class="message-item">
              <div class="message-header" @click="toggleMessage(index)">
                <div style="display: flex; align-items: center; gap: 8px">
                  <span
                    class="role-badge"
                    :class="{
                                          'role-user': message.role === 'user',
                                          'role-assistant': message.role === 'assistant',
                                          'role-system': message.role === 'system',
                                          'role-tool': message.role === 'tool'
                                      }"
                    x-text="message.role"
                  >
                  </span>
                  <span
                    x-text="'Message ' + (index + 1)"
                    style="font-size: 0.8rem"
                  ></span>
                </div>
                <span
                  class="toggle-icon"
                  :class="{ 'rotated': !messageCollapsed[index] }"
                  >▼</span
                >
              </div>
              <div
                class="message-content"
                x-show="!messageCollapsed[index]"
                x-transition
              >
                <div x-html="renderMessageContent(message)"></div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Tools区域 -->
      <div
        class="section"
        x-show="requestBody.tools?.length > 0"
      >
        <div class="section-header" @click="toggleSection('tools')">
          <span class="section-title">
            Tools
            <span
              x-show="requestBody.tools?.length"
              x-text="'(' + requestBody.tools?.length + ')'"
            ></span>
          </span>
          <div class="section-controls">
            <button 
              class="expand-collapse-btn tools"
              x-show="requestBody.tools?.length > 0 && !collapsed.tools"
              @click.stop="toggleAllTools()"
              :title="allToolsExpanded ? 'Collapse All工具' : 'Expand All工具'"
            >
              <svg class="icon" viewBox="0 0 24 24" x-show="allToolsExpanded">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
              <svg class="icon" viewBox="0 0 24 24" x-show="!allToolsExpanded">
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
              <span x-text="allToolsExpanded ? '折叠' : '展开'"></span>
            </button>
            <span class="toggle-icon" :class="{ 'rotated': !collapsed.tools }"
              >▼</span
            >
          </div>
        </div>
        <div class="section-content" x-show="!collapsed.tools" x-transition>
          <template x-for="(tool, index) in requestBody.tools" :key="index">
            <div class="tool-item">
              <div class="tool-header" @click="toggleTool(index)">
                <div style="display: flex; align-items: center; gap: 8px">
                  <span
                    class="tool-name-badge"
                    x-text="tool.function?.name || 'Tool ' + (index + 1)"
                  ></span>
                </div>
                <span
                  class="toggle-icon"
                  :class="{ 'rotated': !toolCollapsed[index] }"
                  >▼</span
                >
              </div>
              <div
                class="tool-content"
                x-show="!toolCollapsed[index]"
                x-transition
              >
                <div x-html="renderToolContent(tool)"></div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <script>
      const requestBodyData = OPENAI_REQUEST_BODY_PLACEHOLDER;

      function requestVisualizer() {
        return {
          requestBody: requestBodyData,
          collapsed: {
            basicInfo: false,
            messages: false,
            tools: false,
          },
          messageCollapsed: {},
          toolCollapsed: {},
          globalCollapsed: false,

          get allMessagesExpanded() {
            if (!this.requestBody.messages?.length) return false;
            return Object.values(this.messageCollapsed).every(val => !val);
          },

          get allToolsExpanded() {
            if (!this.requestBody.tools?.length) return false;
            return Object.values(this.toolCollapsed).every(val => !val);
          },

          init() {
            // 初始化消息折叠状态 - 默认展开
            if (this.requestBody.messages?.length) {
              this.requestBody.messages.forEach((_, index) => {
                this.messageCollapsed[index] = false;
              });
            }

            // 初始化工具折叠状态 - 默认展开
            if (this.requestBody.tools?.length) {
              this.requestBody.tools.forEach((_, index) => {
                this.toolCollapsed[index] = false;
              });
            }
          },

          toggleSection(section) {
            this.collapsed[section] = !this.collapsed[section];
          },

          toggleMessage(index) {
            this.messageCollapsed[index] = !this.messageCollapsed[index];
          },

          toggleTool(index) {
            this.toolCollapsed[index] = !this.toolCollapsed[index];
          },

          toggleAllMessages() {
            const shouldCollapse = this.allMessagesExpanded;
            this.requestBody.messages?.forEach((_, index) => {
              this.messageCollapsed[index] = shouldCollapse;
            });
          },

          toggleAllTools() {
            const shouldCollapse = this.allToolsExpanded;
            this.requestBody.tools?.forEach((_, index) => {
              this.toolCollapsed[index] = shouldCollapse;
            });
          },

          toggleGlobalCollapse() {
            this.globalCollapsed = !this.globalCollapsed;
            
            // 更新所有区域状态
            Object.keys(this.collapsed).forEach(key => {
              this.collapsed[key] = this.globalCollapsed;
            });

            // 更新所有消息状态
            if (this.requestBody.messages?.length) {
              this.requestBody.messages.forEach((_, index) => {
                this.messageCollapsed[index] = this.globalCollapsed;
              });
            }

            // 更新所有工具状态
            if (this.requestBody.tools?.length) {
              this.requestBody.tools.forEach((_, index) => {
                this.toolCollapsed[index] = this.globalCollapsed;
              });
            }
          },

          renderMessageContent(message) {
            // Tool消息直接渲染JSON
            if (message.role === "tool") {
              const content =
                typeof message.content === "string"
                  ? message.content.trim()
                  : JSON.stringify(message.content, null, 2);
              return '<div class="json-content">' + this.escapeHtml(content) + '</div>';
            }

            // 其他消息使用Markdown渲染
            if (typeof message.content === "string") {
              const trimmedContent = message.content.trim();
              if (typeof marked !== "undefined") {
                return '<div class="prose">' + marked.parse(trimmedContent) + '</div>';
              }
              return '<div class="prose">' + trimmedContent.replace(/\\n/g, "<br>") + '</div>';
            }
            return '<div class="json-content">' + this.escapeHtml(JSON.stringify(message.content, null, 2)) + '</div>';
          },

          renderToolContent(tool) {
            if (!tool.function) {
              return '<div class="json-content">' + this.escapeHtml(JSON.stringify(tool, null, 2)) + '</div>';
            }

            const func = tool.function;
            let html = "";

            // 渲染描述
            if (func.description) {
              const descriptionHtml =
                typeof marked !== "undefined"
                  ? marked.parse(func.description.trim())
                  : func.description.trim().replace(/\\n/g, "<br>");
              html += '<div class="tool-description prose">' + descriptionHtml + '</div>';
            }

            // 渲染参数
            if (func.parameters?.properties) {
              html += '<div class="tool-parameters">';
              html += '<div class="tool-parameters-title">参数:</div>';

              const required = func.parameters.required || [];

              Object.entries(func.parameters.properties).forEach(
                ([name, param]) => {
                  const isRequired = required.includes(name);
                  html += '<div class="parameter-item">';
                  html += '<div>';
                  html += '<span class="parameter-name">' + name + '</span>';
                  if (param.type) {
                    html += '<span class="parameter-type">' + param.type + '</span>';
                  }
                  if (isRequired) {
                    html += '<span class="parameter-required">required</span>';
                  }
                  html += '</div>';
                  if (param.description) {
                    html += '<div class="parameter-description">' + this.escapeHtml(param.description) + '</div>';
                  }
                  html += "</div>";
                }
              );

              html += "</div>";
            }

            return html;
          },

          escapeHtml(text) {
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
          },
        };
      }
    </script>
  </body>
</html>
`
export const openai_res_template = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenAI API Response Visualizer</title>
    <script
      defer
      src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          sans-serif;
        color: #000000;
        line-height: 1.5;
        font-size: 14px;
      }

      .container {
        padding: 12px;
        border: 1px solid gray;
        border-radius: 8px;
      }

      .header {
        text-align: center;
        margin-bottom: 16px;
        position: relative;
      }

      .header h1 {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .header p {
        color: #64748b;
        font-size: 0.875rem;
      }

      .global-collapse-btn {
        position: absolute;
        top: 0;
        right: 0;
        background: #e2e8f0;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.75rem;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s;
      }

      .global-collapse-btn:hover {
        background: #cbd5e1;
      }

      .section {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }

      .section-header {
        padding: 10px 12px;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s;
      }

      .section-header:hover {
        background: #e2e8f0;
      }

      .section-title {
        font-weight: 600;
        font-size: 0.95rem;
        color: #1e293b;
      }

      .section-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .expand-collapse-btn {
        background: #dbeafe;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.7rem;
        color: #1d4ed8;
        display: flex;
        align-items: center;
        gap: 2px;
        transition: background-color 0.2s;
      }

      .expand-collapse-btn:hover {
        background: #bfdbfe;
      }

      .expand-collapse-btn.choices {
        background: #dcfce7;
        color: #166534;
      }

      .expand-collapse-btn.choices:hover {
        background: #bbf7d0;
      }

      .toggle-icon {
        transition: transform 0.2s;
        color: #64748b;
        font-size: 0.75rem;
      }

      .toggle-icon.rotated {
        transform: rotate(180deg);
      }

      .section-content {
        padding: 2px;
      }

      .info-item {
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .info-item:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 500;
        min-width: 120px;
      }

      .info-value {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.8rem;
      }

      .choice-item {
        border-bottom: 2px solid #7eb4e950;
        padding: 4px 8px;
      }

      .choice-item:last-child {
        border-bottom: none;
      }

      .choice-header {
        padding: 6px 0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .choice-header:hover {
        background: #f8fafc;
        margin: 0 -12px;
        padding: 6px 12px;
        border-radius: 4px;
      }

      .choice-badge {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.65rem;
        font-weight: 600;
        background: #dcfce7;
        color: #166534;
      }

      .finish-reason-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .finish-stop {
        background: #dcfce7;
        color: #166534;
      }

      .finish-length {
        background: #fef3c7;
        color: #92400e;
      }

      .finish-tool-calls {
        background: #f3e8ff;
        color: #7c3aed;
      }

      .finish-content-filter {
        background: #fee2e2;
        color: #dc2626;
      }

      .choice-content {
        padding: 4px 16px;
        font-size: initial;
        background-color: #88bcc515;
        overflow-y: auto;
      }

      .choice-meta {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 0.75rem;
        color: #64748b;
      }

      .choice-meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .json-content {
        font-family: "Monaco", "Menlo", monospace;
        background: #f8fafc;
        padding: 8px;
        border-radius: 4px;
        white-space: pre-wrap;
        font-size: 0.75rem;
      }

      .tool-calls-container {
        margin-top: 12px;
      }

      .tool-call-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 8px;
        overflow: hidden;
      }

      .tool-call-header {
        background: #f3e8ff;
        padding: 8px 12px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
      }

      .tool-call-header:hover {
        background: #e9d5ff;
      }

      .tool-call-name {
        font-weight: 600;
        color: #7c3aed;
        font-family: "Monaco", "Menlo", monospace;
      }

      .tool-call-id {
        font-size: 0.7rem;
        color: #64748b;
        font-family: "Monaco", "Menlo", monospace;
      }

      .tool-call-content {
        padding: 8px 12px;
      }

      /* GitHub-style Markdown prose */
      .prose {
        line-height: 1.6;
        color: #24292f;
      }

      .prose h1,
      .prose h2,
      .prose h3,
      .prose h4,
      .prose h5,
      .prose h6 {
        margin-top: 16px;
        margin-bottom: 8px;
        font-weight: 600;
        line-height: 1.25;
      }

      .prose h1 {
        font-size: 1.25em;
        border-bottom: 1px solid #d0d7de;
        padding-bottom: 4px;
      }
      .prose h2 {
        font-size: 1.1em;
        border-bottom: 1px solid #d0d7de;
        padding-bottom: 4px;
      }
      .prose h3 {
        font-size: 1em;
      }
      .prose h4 {
        font-size: 0.9em;
      }
      .prose h5 {
        font-size: 0.85em;
      }
      .prose h6 {
        font-size: 0.8em;
        color: #656d76;
      }

      .prose p {
        margin-top: 0;
        margin-bottom: 8px;
      }

      .prose ul,
      .prose ol {
        margin-top: 0;
        margin-bottom: 8px;
        padding-left: 20px;
      }

      .prose li {
        margin-bottom: 2px;
      }

      .prose blockquote {
        margin: 8px 0;
        padding: 0 12px;
        color: #656d76;
        border-left: 3px solid #d0d7de;
      }

      .prose code {
        background: rgba(175, 184, 193, 0.2);
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 0.85em;
        font-family: "Monaco", "Menlo", "Consolas", monospace;
      }

      .prose pre {
        background: #f6f8fa;
        border-radius: 6px;
        padding: 12px;
        overflow-x: auto;
        margin: 8px 0;
        border: 1px solid #d0d7de;
      }

      .prose pre code {
        background: none;
        padding: 0;
        font-size: 0.8em;
      }

      .prose a {
        color: #0969da;
        text-decoration: none;
      }

      .prose a:hover {
        text-decoration: underline;
      }

      .prose strong {
        font-weight: 600;
      }

      .prose em {
        font-style: italic;
      }

      .prose table {
        border-collapse: collapse;
        margin: 8px 0;
        width: 100%;
      }

      .prose th,
      .prose td {
        border: 1px solid #d0d7de;
        padding: 6px 8px;
        text-align: left;
      }

      .prose th {
        background: #f6f8fa;
        font-weight: 600;
      }

      .empty-state {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 20px 12px;
        font-size: 0.8rem;
      }

      /* SVG Icons */
      .icon {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }

      .usage-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
        margin-top: 8px;
      }

      .usage-item {
        background: #f8fafc;
        padding: 8px;
        border-radius: 4px;
        text-align: center;
        border: 1px solid #e2e8f0;
      }

      .usage-label {
        font-size: 0.7rem;
        color: #64748b;
        margin-bottom: 2px;
      }

      .usage-value {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <div class="container" x-data="responseVisualizer()">
      <div class="header">
        <button 
          class="global-collapse-btn" 
          @click="toggleGlobalCollapse()"
          :title="globalCollapsed ? 'Expand All' : 'Collapse All'"
        >
          <svg class="icon" viewBox="0 0 24 24" x-show="!globalCollapsed">
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
          </svg>
          <svg class="icon" viewBox="0 0 24 24" x-show="globalCollapsed">
            <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/>
          </svg>
          <span x-text="globalCollapsed ? 'Expand All' : 'Collapse All'"></span>
        </button>
        <h1>OpenAI API Response</h1>
        <p>Basic Info</p>
      </div>

      <!-- Basic Info区域 -->
      <div class="section">
        <div class="section-header" @click="toggleSection('basicInfo')">
          <span class="section-title">Basic Info</span>
          <span class="toggle-icon" :class="{ 'rotated': !collapsed.basicInfo }"
            >▼</span
          >
        </div>
        <div class="section-content" x-show="!collapsed.basicInfo" x-transition>
          <div class="info-item" x-show="responseBody.id">
            <div class="info-label">Response ID</div>
            <div class="info-value" x-text="responseBody.id"></div>
          </div>
          <div class="info-item" x-show="responseBody.object">
            <div class="info-label">Object Type</div>
            <div class="info-value" x-text="responseBody.object"></div>
          </div>
          <div class="info-item" x-show="responseBody.created">
            <div class="info-label">Created</div>
            <div class="info-value" x-text="formatTimestamp(responseBody.created)"></div>
          </div>
          <div class="info-item" x-show="responseBody.model">
            <div class="info-label">Model</div>
            <div class="info-value" x-text="responseBody.model"></div>
          </div>
          <div class="info-item" x-show="responseBody.system_fingerprint">
            <div class="info-label">System Fingerprint</div>
            <div class="info-value" x-text="responseBody.system_fingerprint"></div>
          </div>
        </div>
      </div>

      <!-- TokenUsage区域 -->
      <div class="section" x-show="responseBody.usage">
        <div class="section-header" @click="toggleSection('usage')">
          <span class="section-title">Token Usage</span>
          <span class="toggle-icon" :class="{ 'rotated': !collapsed.usage }"
            >▼</span
          >
        </div>
        <div class="section-content" x-show="!collapsed.usage" x-transition>
          <div class="usage-grid">
            <div class="usage-item" x-show="responseBody.usage?.prompt_tokens">
              <div class="usage-label">Prompt Tokens</div>
              <div class="usage-value" x-text="responseBody.usage?.prompt_tokens"></div>
            </div>
            <div class="usage-item" x-show="responseBody.usage?.completion_tokens">
              <div class="usage-label">Completion Tokens</div>
              <div class="usage-value" x-text="responseBody.usage?.completion_tokens"></div>
            </div>
            <div class="usage-item" x-show="responseBody.usage?.total_tokens">
              <div class="usage-label">Total Tokens</div>
              <div class="usage-value" x-text="responseBody.usage?.total_tokens"></div>
            </div>
            <div class="usage-item" x-show="responseBody.usage?.prompt_tokens_details?.cached_tokens">
              <div class="usage-label">Cached Tokens</div>
              <div class="usage-value" x-text="responseBody.usage?.prompt_tokens_details?.cached_tokens"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Choices区域 -->
      <div class="section">
        <div class="section-header" @click="toggleSection('choices')">
          <span class="section-title">
            Choices
            <span
              x-show="responseBody.choices?.length"
              x-text="'(' + responseBody.choices?.length + ')'"
            ></span>
          </span>
          <div class="section-controls">
            <button 
              class="expand-collapse-btn choices"
              x-show="responseBody.choices?.length > 0 && !collapsed.choices"
              @click.stop="toggleAllChoices()"
              :title="allChoicesExpanded ? 'Collapse All选择' : 'Expand All选择'"
            >
              <svg class="icon" viewBox="0 0 24 24" x-show="allChoicesExpanded">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
              <svg class="icon" viewBox="0 0 24 24" x-show="!allChoicesExpanded">
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
              <span x-text="allChoicesExpanded ? '折叠' : '展开'"></span>
            </button>
            <span class="toggle-icon" :class="{ 'rotated': !collapsed.choices }"
              >▼</span
            >
          </div>
        </div>
        <div class="section-content" x-show="!collapsed.choices" x-transition>
          <template
            x-if="!responseBody.choices?.length"
          >
            <div class="empty-state">暂无选择结果</div>
          </template>
          <template
            x-for="(choice, index) in responseBody.choices"
            :key="index"
          >
            <div class="choice-item">
              <div class="choice-header" @click="toggleChoice(index)">
                <div style="display: flex; align-items: center; gap: 8px">
                  <span class="choice-badge" x-text="'Choice ' + (index + 1)"></span>
                  <span
                    class="finish-reason-badge"
                    :class="{
                      'finish-stop': choice.finish_reason === 'stop',
                      'finish-length': choice.finish_reason === 'length',
                      'finish-tool-calls': choice.finish_reason === 'tool_calls',
                      'finish-content-filter': choice.finish_reason === 'content_filter'
                    }"
                    x-text="choice.finish_reason || 'unknown'"
                  ></span>
                </div>
                <span
                  class="toggle-icon"
                  :class="{ 'rotated': !choiceCollapsed[index] }"
                  >▼</span
                >
              </div>
              <div
                class="choice-content"
                x-show="!choiceCollapsed[index]"
                x-transition
              >
                <div class="choice-meta">
                  <div class="choice-meta-item" x-show="choice.index !== undefined">
                    <span>Index:</span>
                    <span x-text="choice.index"></span>
                  </div>
                  <div class="choice-meta-item" x-show="choice.logprobs">
                    <span>Log Probs:</span>
                    <span>Available</span>
                  </div>
                </div>
                
                <!-- Message Content -->
                <div x-show="choice.message?.content" x-html="renderMessageContent(choice.message.content)"></div>
                
                <!-- Tool Calls -->
                <div x-show="choice.message?.tool_calls?.length" class="tool-calls-container">
                  <h4 style="margin-bottom: 8px; font-size: 0.9rem; color: #1e293b;">Tool Calls:</h4>
                  <template x-for="(toolCall, toolIndex) in choice.message.tool_calls" :key="toolIndex">
                    <div class="tool-call-item">
                      <div class="tool-call-header" @click="toggleToolCall(index, toolIndex)">
                        <div>
                          <div class="tool-call-name" x-text="toolCall.function?.name || 'Unknown Function'"></div>
                          <div class="tool-call-id" x-text="'ID: ' + (toolCall.id || 'N/A')"></div>
                        </div>
                        <span
                          class="toggle-icon"
                          :class="{ 'rotated': !toolCallCollapsed[index + '_' + toolIndex] }"
                          >▼</span
                        >
                      </div>
                      <div
                        class="tool-call-content"
                        x-show="!toolCallCollapsed[index + '_' + toolIndex]"
                        x-transition
                      >
                        <div class="json-content" x-text="JSON.stringify(toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {}, null, 2)"></div>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Log Probs (if available) -->
                <div x-show="choice.logprobs" style="margin-top: 12px;">
                  <h4 style="margin-bottom: 8px; font-size: 0.9rem; color: #1e293b;">Log Probabilities:</h4>
                  <div class="json-content" x-text="JSON.stringify(choice.logprobs, null, 2)"></div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <script>
      const responseBodyData = OPENAI_RESPONSE_BODY_PLACEHOLDER;

      function responseVisualizer() {
        return {
          responseBody: responseBodyData,
          collapsed: {
            basicInfo: false,
            usage: false,
            choices: false,
          },
          choiceCollapsed: {},
          toolCallCollapsed: {},
          globalCollapsed: false,

          get allChoicesExpanded() {
            if (!this.responseBody.choices?.length) return false;
            return Object.values(this.choiceCollapsed).every(val => !val);
          },

          init() {
            // 初始化选择折叠状态 - 默认展开
            if (this.responseBody.choices?.length) {
              this.responseBody.choices.forEach((choice, index) => {
                this.choiceCollapsed[index] = false;
                
                // 初始化工具调用折叠状态
                if (choice.message?.tool_calls?.length) {
                  choice.message.tool_calls.forEach((_, toolIndex) => {
                    this.toolCallCollapsed[index + '_' + toolIndex] = false;
                  });
                }
              });
            }
          },

          toggleSection(section) {
            this.collapsed[section] = !this.collapsed[section];
          },

          toggleChoice(index) {
            this.choiceCollapsed[index] = !this.choiceCollapsed[index];
          },

          toggleToolCall(choiceIndex, toolIndex) {
            const key = choiceIndex + '_' + toolIndex;
            this.toolCallCollapsed[key] = !this.toolCallCollapsed[key];
          },

          toggleGlobalCollapse() {
            this.globalCollapsed = !this.globalCollapsed;
            // 更新所有区域状态
            Object.keys(this.collapsed).forEach(key => {
              this.collapsed[key] = this.globalCollapsed;
            });
            // 更新所有选择状态
            if (this.responseBody.choices?.length) {
              this.responseBody.choices.forEach((choice, index) => {
                this.choiceCollapsed[index] = this.globalCollapsed;
                // 更新工具调用状态
                if (choice.tool_calls?.length) {
                  choice.tool_calls.forEach((_, toolIndex) => {
                    this.toolCallCollapsed[index + '_' + toolIndex] = this.globalCollapsed;
                  });
                }
              });
            }
          },

          renderMessageContent(message) {
            if (!message) return '';
            
            if (typeof message === "string") {
              const trimmedContent = message.trim();
              if (typeof marked !== "undefined") {
                return '<div class="prose">' + marked.parse(trimmedContent) + '</div>';
              }
              return '<div class="prose">' + trimmedContent.replace(/\\n/g, "<br>") + '</div>';
            }
            return '<div class="json-content">' + this.escapeHtml(JSON.stringify(message, null, 2)) + '</div>';
          },

          formatTimestamp(timestamp) {
            if (!timestamp) return '';
            return new Date(timestamp * 1000).toLocaleString('zh-CN');
          },

          escapeHtml(text) {
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
          },
        };
      }
    </script>
  </body>
</html>
`



export const openai_res_sse_template = (events: any) => `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenAI SSE Response Visualizer</title>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .container {
        padding: 12px;
        border: 1px solid gray;
        border-radius: 8px;
      }

      /* header 区域样式对齐 openai_res_template */
      .header {
        text-align: center;
        margin-bottom: 16px;
        position: relative;
      }

      .header h1 {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .header p {
        color: #64748b;
        font-size: 0.875rem;
      }

      .global-collapse-btn {
        position: absolute;
        top: 0;
        right: 0;
        background: #e2e8f0;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.75rem;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s;
      }
      .global-collapse-btn:hover {
        background: #cbd5e1;
      }

      .event-badge {
        position: absolute;
        top: 16px;
        left: 16px;
        background: rgba(100, 116, 139, 0.08);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        color: #334155;
        backdrop-filter: blur(10px);
      }

      .content {
        padding: 24px;
      }

      .section {
        background: #f8fafc;
        border-radius: 8px;
        margin-bottom: 16px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }

      .section-header {
        padding: 16px 20px;
        background: white;
        border-bottom: 1px solid #e2e8f0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s;
      }

      .section-header:hover {
        background: #f1f5f9;
      }

      .section-title {
        font-weight: 600;
        font-size: 1.1rem;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-icon {
        width: 20px;
        height: 20px;
        fill: #64748b;
      }

      .toggle-icon {
        transition: transform 0.2s;
        color: #64748b;
        font-size: 1rem;
      }

      .toggle-icon.rotated {
        transform: rotate(180deg);
      }

      .section-content {
        padding: 20px;
        background: white;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }


      .info-item {
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .info-item:last-child {
        border-bottom: none;
      }
      .info-label {
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .info-value {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.95rem;
        word-break: break-all;
      }

      .usage-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
      }

      .usage-item {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      }

      .usage-label {
        font-size: 0.8rem;
        opacity: 0.9;
        margin-bottom: 8px;
      }

      .usage-value {
        font-weight: 700;
        font-size: 1.5rem;
      }

      .choice-item {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 16px;
        overflow: hidden;
      }

      .choice-header {
        padding: 16px 20px;
        background: #f8fafc;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s;
      }

      .choice-header:hover {
        background: #f1f5f9;
      }

      .choice-meta {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .choice-badge {
        background: #3b82f6;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .finish-reason-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .finish-stop { background: #dcfce7; color: #166534; }
      .finish-length { background: #fef3c7; color: #92400e; }
      .finish-tool-calls { background: #f3e8ff; color: #7c3aed; }
      .finish-content-filter { background: #fee2e2; color: #dc2626; }

      .choice-content {
        padding: 20px;
      }

      .content-section {
        margin-bottom: 20px;
      }

      .content-section h4 {
        font-size: 0.95rem;
        color: #1e293b;
        margin-bottom: 12px;
        font-weight: 600;
      }

      /* SVG Icons */
      .icon {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }

      .prose {
        line-height: 1.7;
        color: #374151;
      }

      .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
        margin-top: 16px;
        margin-bottom: 8px;
        font-weight: 600;
        line-height: 1.25;
        color: #1f2937;
      }

      .prose p {
        margin-bottom: 12px;
      }

      .prose code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.9em;
        font-family: "Monaco", "Menlo", monospace;
      }

      .prose pre {
        background: #1f2937;
        color: #f9fafb;
        border-radius: 8px;
        padding: 16px;
        overflow-x: auto;
        margin: 12px 0;
      }

      .prose pre code {
        background: none;
        padding: 0;
        color: inherit;
      }

      .tool-calls-container {
        margin-top: 20px;
      }

      .tool-call-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 12px;
        overflow: hidden;
      }

      .tool-call-header {
        background: #f3e8ff;
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tool-call-header:hover {
        background: #e9d5ff;
      }

      .tool-call-name {
        font-weight: 600;
        color: #7c3aed;
        font-family: "Monaco", "Menlo", monospace;
      }

      .tool-call-id {
        font-size: 0.8rem;
        color: #64748b;
        font-family: "Monaco", "Menlo", monospace;
      }

      .tool-call-content {
        padding: 16px;
      }

      .json-content {
        font-family: "Monaco", "Menlo", monospace;
        background: #1f2937;
        color: #f9fafb;
        padding: 16px;
        border-radius: 6px;
        white-space: pre-wrap;
        font-size: 0.85rem;
        overflow-x: auto;
      }

      .empty-state {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 40px 20px;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <div class="container" x-data="sseVisualizer()">
      <div class="header">
        <button 
          class="global-collapse-btn" 
          @click="toggleGlobalCollapse()"
          :title="globalCollapsed ? 'Expand All' : 'Collapse All'"
        >
          <svg class="icon" viewBox="0 0 24 24" x-show="!globalCollapsed">
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
          </svg>
          <svg class="icon" viewBox="0 0 24 24" x-show="globalCollapsed">
            <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/>
          </svg>
          <span x-text="globalCollapsed ? 'Expand All' : 'Collapse All'"></span>
        </button>
        <div class="event-badge" x-text="responseBody.eventCount + ' events'"></div>
        <h1>OpenAI SSE Response</h1>
        <p>Server-Sent Events 响应可视化</p>
      </div>
      <div class="content">
        <!-- Basic Info区域 -->
        <div class="section">
          <div class="section-header" @click="toggleSection('basicInfo')">
            <div class="section-title">
              <svg class="section-icon" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Basic Info
            </div>
            <span class="toggle-icon" :class="{ 'rotated': !collapsed.basicInfo }">▼</span>
          </div>
          <div class="section-content" x-show="!collapsed.basicInfo" x-transition>

              <div class="info-item">
                <div class="info-label">Model</div>
                <div class="info-value" x-text="responseBody.model"></div>
              </div>
              <div class="info-item">
                <div class="info-label">Created</div>
                <div class="info-value" x-text="formatTimestamp(responseBody.created)"></div>
              </div>
              <div class="info-item" x-show="responseBody.system_fingerprint">
                <div class="info-label">System Fingerprint</div>
                <div class="info-value" x-text="responseBody.system_fingerprint"></div>
              </div>
              <div class="info-item">
                <div class="info-label">Events Count</div>
                <div class="info-value" x-text="responseBody.eventCount"></div>
              </div>

          </div>
        </div>

        <!-- TokenUsage区域 -->
        <div class="section" x-show="responseBody.usage">
          <div class="section-header" @click="toggleSection('usage')">
            <div class="section-title">
              <svg class="section-icon" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Token Usage
            </div>
            <span class="toggle-icon" :class="{ 'rotated': !collapsed.usage }">▼</span>
          </div>
          <div class="section-content" x-show="!collapsed.usage" x-transition>
            <div class="usage-grid">
              <div class="usage-item" x-show="responseBody.usage?.prompt_tokens">
                <div class="usage-label">Prompt Tokens</div>
                <div class="usage-value" x-text="responseBody.usage?.prompt_tokens"></div>
              </div>
              <div class="usage-item" x-show="responseBody.usage?.completion_tokens">
                <div class="usage-label">Completion Tokens</div>
                <div class="usage-value" x-text="responseBody.usage?.completion_tokens"></div>
              </div>
              <div class="usage-item" x-show="responseBody.usage?.total_tokens">
                <div class="usage-label">Total Tokens</div>
                <div class="usage-value" x-text="responseBody.usage?.total_tokens"></div>
              </div>
              <div class="usage-item" x-show="responseBody.usage?.prompt_tokens_details?.cached_tokens">
                <div class="usage-label">Cached Tokens</div>
                <div class="usage-value" x-text="responseBody.usage?.prompt_tokens_details?.cached_tokens"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Choices区域 -->
        <div class="section">
          <div class="section-header" @click="toggleSection('choices')">
            <div class="section-title">
              <svg class="section-icon" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Choices
              <span x-show="responseBody.choices?.length" x-text="'(' + responseBody.choices?.length + ')'"></span>
            </div>
            <span class="toggle-icon" :class="{ 'rotated': !collapsed.choices }">▼</span>
          </div>
          <div class="section-content" x-show="!collapsed.choices" x-transition>
            <template x-if="!responseBody.choices?.length">
              <div class="empty-state">暂无选择结果</div>
            </template>
            <template x-for="(choice, index) in responseBody.choices" :key="index">
              <div class="choice-item">
                <div class="choice-header" @click="toggleChoice(index)">
                  <div class="choice-meta">
                    <span class="choice-badge" x-text="'Choice ' + (index + 1)"></span>
                    <span class="finish-reason-badge" 
                          :class="{
                            'finish-stop': choice.finish_reason === 'stop',
                            'finish-length': choice.finish_reason === 'length',
                            'finish-tool-calls': choice.finish_reason === 'tool_calls',
                            'finish-content-filter': choice.finish_reason === 'content_filter'
                          }"
                          x-text="choice.finish_reason || 'unknown'"></span>
                  </div>
                  <span class="toggle-icon" :class="{ 'rotated': !choiceCollapsed[index] }">▼</span>
                </div>
                <div class="choice-content" x-show="!choiceCollapsed[index]" x-transition>
                  <!-- Message Content -->
                  <div x-show="choice.content" class="content-section">
                    <h4>Content:</h4>
                    <div x-html="renderContent(choice.content)"></div>
                  </div>
                  
                  <!-- Tool Calls -->
                  <div x-show="choice.tool_calls?.length" class="tool-calls-container">
                    <h4>Tool Calls:</h4>
                    <template x-for="(toolCall, toolIndex) in choice.tool_calls" :key="toolIndex">
                      <div class="tool-call-item">
                        <div class="tool-call-header" @click="toggleToolCall(index, toolIndex)">
                          <div>
                            <div class="tool-call-name" x-text="toolCall.function?.name || 'Unknown Function'"></div>
                            <div class="tool-call-id" x-text="'ID: ' + (toolCall.id || 'N/A')"></div>
                          </div>
                          <span class="toggle-icon" :class="{ 'rotated': !toolCallCollapsed[index + '_' + toolIndex] }">▼</span>
                        </div>
                        <div class="tool-call-content" x-show="!toolCallCollapsed[index + '_' + toolIndex]" x-transition>
                          <div class="json-content" x-text="formatJSON(toolCall.function?.arguments)"></div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <script>
      const responseBodyData = ${JSON.stringify(events, null, 2)}

      function sseVisualizer() {
        return {
          responseBody: responseBodyData,
          collapsed: {
            basicInfo: false,
            usage: false,
            choices: false,
          },
          choiceCollapsed: {},
          toolCallCollapsed: {},
          globalCollapsed: false,


          init() {
            // Initialize choice collapsed states
            if (this.responseBody.choices?.length) {
              this.responseBody.choices.forEach((choice, index) => {
                this.choiceCollapsed[index] = false;
                
                // Initialize tool call collapsed states
                if (choice.tool_calls?.length) {
                  choice.tool_calls.forEach((_, toolIndex) => {
                    this.toolCallCollapsed[index + '_' + toolIndex] = false;
                  });
                }
              });
            }
          },

          toggleSection(section) {
            this.collapsed[section] = !this.collapsed[section];
          },

          toggleChoice(index) {
            this.choiceCollapsed[index] = !this.choiceCollapsed[index];
          },

          toggleToolCall(choiceIndex, toolIndex) {
            const key = choiceIndex + '_' + toolIndex;
            this.toolCallCollapsed[key] = !this.toolCallCollapsed[key];
          },

          toggleGlobalCollapse() {
            this.globalCollapsed = !this.globalCollapsed;
            // 更新所有区域状态
            Object.keys(this.collapsed).forEach(key => {
              this.collapsed[key] = this.globalCollapsed;
            });
            // 更新所有选择状态
            if (this.responseBody.choices?.length) {
              this.responseBody.choices.forEach((choice, index) => {
                this.choiceCollapsed[index] = this.globalCollapsed;
                // 更新工具调用状态
                if (choice.tool_calls?.length) {
                  choice.tool_calls.forEach((_, toolIndex) => {
                    this.toolCallCollapsed[index + '_' + toolIndex] = this.globalCollapsed;
                  });
                }
              });
            }
          },

          get allChoicesExpanded() {
            if (!this.responseBody.choices?.length) return false;
            return Object.values(this.choiceCollapsed).every(val => !val);
          },

          renderContent(content) {
            if (!content) return '';
            const trimmedContent = content.trim();
            if (typeof marked !== "undefined") {
              return '<div class="prose">' + marked.parse(trimmedContent) + '</div>';
            }
            return '<div class="prose">' + trimmedContent.replace(/\\n/g, "<br>") + '</div>';
          },

          formatJSON(jsonString) {
            if (!jsonString) return '{}';
            try {
              const parsed = JSON.parse(jsonString);
              return JSON.stringify(parsed, null, 2);
            } catch {
              return jsonString;
            }
          },

          formatTimestamp(timestamp) {
            if (!timestamp) return '';
            return new Date(timestamp * 1000).toLocaleString('zh-CN');
          }
        };
      }
    </script>
  </body>
</html>`