<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import RoleBadge from '../RoleBadge.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import ImageBlock from '../../content/ImageBlock.vue';
import type {
  GeminiReqContent,
  Part,
  TextPart,
  InlineDataPart,
  FileDataPart,
  FunctionCallPart,
  FunctionResponsePart,
  ExecutableCodePart,
  CodeExecutionResultPart,
} from '@/types/gemini/request';
import { hashId } from '@/utils/id/hashId';

interface Props {
  id?: string;
  index: number;
  content: GeminiReqContent;
}

const props = defineProps<Props>();

const storageKey = computed(() => `gemini-msg-${props.id || hashId(JSON.stringify(props.content))}-open`);
const isOpen = useSessionStorage(storageKey, true);

const role = computed(() => props.content.role);
const parts = computed(() => props.content.parts || []);

// 检查part类型
const isTextPart = (part: Part): part is TextPart => 'text' in part;
const isInlineDataPart = (part: Part): part is InlineDataPart => 'inlineData' in part;
const isFileDataPart = (part: Part): part is FileDataPart => 'fileData' in part;
const isFunctionCallPart = (part: Part): part is FunctionCallPart => 'functionCall' in part;
const isFunctionResponsePart = (part: Part): part is FunctionResponsePart => 'functionResponse' in part;
const isExecutableCodePart = (part: Part): part is ExecutableCodePart => 'executableCode' in part;
const isCodeExecutionResultPart = (part: Part): part is CodeExecutionResultPart => 'codeExecutionResult' in part;

// 获取inline data的data URL
const getInlineDataUrl = (part: InlineDataPart): string => {
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
};

// 获取part的key用于v-for
const getPartKey = (part: Part, idx: number): string => {
  if (isTextPart(part)) return `text-${idx}`;
  if (isInlineDataPart(part)) return `inline-${idx}`;
  if (isFileDataPart(part)) return `file-${idx}`;
  if (isFunctionCallPart(part)) return `call-${idx}`;
  if (isFunctionResponsePart(part)) return `response-${idx}`;
  if (isExecutableCodePart(part)) return `code-${idx}`;
  if (isCodeExecutionResultPart(part)) return `result-${idx}`;
  return `part-${idx}`;
};
</script>

<template>
  <div class="message" :class="`role-${role.toLowerCase()}`">
    <div class="header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index + 1 }}</span>
        <RoleBadge :role="role === 'model' ? 'model' : role" />
      </div>
      <span class="part-count">{{ parts.length }} part(s)</span>
    </div>

    <div v-show="isOpen" class="content">
      <div v-if="parts.length === 0" class="empty-state">
        No parts in this message
      </div>

      <template v-for="(part, idx) in parts" :key="getPartKey(part, idx)">
        <!-- Text Part -->
        <div v-if="isTextPart(part)" class="part text-part">
          <SmartViewer :text="part.text" />
        </div>

        <!-- Inline Data Part (Image) -->
        <div v-else-if="isInlineDataPart(part)" class="part media-part">
          <div class="media-label">Inline Data ({{ part.inlineData.mimeType }})</div>
          <ImageBlock :url="getInlineDataUrl(part)" />
        </div>

        <!-- File Data Part -->
        <div v-else-if="isFileDataPart(part)" class="part file-part">
          <div class="file-info">
            <span class="file-icon">📎</span>
            <span class="file-uri">{{ part.fileData.fileUri }}</span>
            <span class="file-mime">({{ part.fileData.mimeType }})</span>
          </div>
        </div>

        <!-- Function Call Part -->
        <div v-else-if="isFunctionCallPart(part)" class="part function-call-part">
          <div class="function-header">
            <span class="function-icon">🔧</span>
            <span class="function-name">{{ part.functionCall.name }}</span>
          </div>
          <pre class="function-args">{{ JSON.stringify(part.functionCall.args, null, 2) }}</pre>
        </div>

        <!-- Function Response Part -->
        <div v-else-if="isFunctionResponsePart(part)" class="part function-response-part">
          <div class="function-header">
            <span class="function-icon">📤</span>
            <span class="function-name">{{ part.functionResponse.name }}</span>
          </div>
          <pre class="function-response">{{ JSON.stringify(part.functionResponse.response, null, 2) }}</pre>
        </div>

        <!-- Executable Code Part -->
        <div v-else-if="isExecutableCodePart(part)" class="part code-part">
          <div class="code-header">
            <span class="code-icon">💻</span>
            <span class="code-lang">{{ part.executableCode.language }}</span>
          </div>
          <pre class="code-content">{{ part.executableCode.code }}</pre>
        </div>

        <!-- Code Execution Result Part -->
        <div v-else-if="isCodeExecutionResultPart(part)" class="part result-part">
          <div class="result-header">
            <span class="result-icon">📊</span>
            <span class="result-outcome" :class="`outcome-${part.codeExecutionResult.outcome.toLowerCase()}`">
              {{ part.codeExecutionResult.outcome }}
            </span>
          </div>
          <pre class="result-output">{{ part.codeExecutionResult.output }}</pre>
        </div>

        <!-- Unknown Part -->
        <div v-else class="part unknown-part">
          <pre>{{ JSON.stringify(part, null, 2) }}</pre>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.message {
  border-bottom: 2px solid rgba(126, 180, 233, 0.31);
  padding: var(--llm-spacing-xs) var(--llm-spacing-md);
}

.message:last-child {
  border-bottom: none;
}

.role-user { border-left: 3px solid var(--llm-border-user); }
.role-model { border-left: 3px solid var(--llm-border-assistant); }
.role-system { border-left: 3px solid var(--llm-border-system); }
.role-function { border-left: 3px solid var(--llm-border-tool); }

.header {
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header:hover {
  background: var(--llm-bg-hover);
  margin: 0 -12px;
  padding: 6px 12px;
  border-radius: var(--llm-radius-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md);
}

.toggle {
  color: var(--llm-text-secondary);
  font-size: 1.2rem;
}

.index {
  font-size: 1.2rem;
  color: var(--llm-text-muted);
  font-weight: 500;
}

.part-count {
  font-size: 1.1rem;
  color: var(--llm-text-muted);
}

.content {
  padding: var(--llm-spacing-xs) var(--llm-spacing-xl);
}

.empty-state {
  text-align: center;
  color: var(--llm-text-secondary);
  font-style: italic;
  padding: 20px;
}

/* Part styles */
.part {
  margin-bottom: var(--llm-spacing-md);
  padding: var(--llm-spacing-sm);
  border-radius: var(--llm-radius-md);
  background: var(--llm-bg-content);
}

.part:last-child {
  margin-bottom: 0;
}

/* Media part */
.media-label {
  font-size: 1.1rem;
  color: var(--llm-text-muted);
  margin-bottom: var(--llm-spacing-xs);
}

/* File part */
.file-part {
  background: #f1f5f9;
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-sm);
  font-size: 1.2rem;
}

.file-icon {
  font-size: 1.4rem;
}

.file-uri {
  font-family: var(--llm-font-mono);
  color: var(--llm-text-primary);
}

.file-mime {
  color: var(--llm-text-muted);
}

/* Function call/response parts */
.function-call-part,
.function-response-part {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
}

.function-header {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-sm);
  margin-bottom: var(--llm-spacing-xs);
  font-weight: 600;
}

.function-icon {
  font-size: 1.2rem;
}

.function-name {
  color: #92400e;
}

.function-args,
.function-response {
  margin: 0;
  padding: var(--llm-spacing-sm);
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--llm-radius-sm);
  font-family: var(--llm-font-mono);
  font-size: 1.1rem;
  overflow-x: auto;
}

/* Code part */
.code-part {
  background: #1e1e1e;
  color: #d4d4d4;
}

.code-header {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-sm);
  margin-bottom: var(--llm-spacing-xs);
  padding-bottom: var(--llm-spacing-xs);
  border-bottom: 1px solid #333;
}

.code-icon {
  font-size: 1.2rem;
}

.code-lang {
  color: #9cdcfe;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 1.1rem;
}

.code-content {
  margin: 0;
  font-family: var(--llm-font-mono);
  font-size: 1.1rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Result part */
.result-part {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;
}

.result-header {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-sm);
  margin-bottom: var(--llm-spacing-xs);
}

.result-icon {
  font-size: 1.2rem;
}

.result-outcome {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 1.1rem;
}

.outcome-success { color: #16a34a; }
.outcome-failure { color: #dc2626; }
.outcome-error { color: #dc2626; }

.result-output {
  margin: 0;
  padding: var(--llm-spacing-sm);
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--llm-radius-sm);
  font-family: var(--llm-font-mono);
  font-size: 1.1rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Unknown part */
.unknown-part {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.unknown-part pre {
  margin: 0;
  font-family: var(--llm-font-mono);
  font-size: 1.1rem;
  overflow-x: auto;
}
</style>
