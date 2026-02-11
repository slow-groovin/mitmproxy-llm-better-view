<script setup lang="ts">
import { computed } from 'vue';
import { hashId } from '@/utils/id/hashId';
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
import GeminiFunctionCall from './GeminiFunctionCall.vue';
import GeminiFunctionResponse from './GeminiFunctionResponse.vue';
import MessageItem from '../MessageItem.vue';
import SubMessageItem from '../SubMessageItem.vue';

interface Props {
  id?: string;
  index: number;
  content: GeminiReqContent;
}

const props = defineProps<Props>();

// 生成消息唯一的 Hash ID
const msgHashId = hashId(JSON.stringify(props.content));

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

// 获取badge类型和文本
const getBadgeInfo = (part: Part): { type: 'text' | 'image' | 'tool' | 'thinking' | 'system'; text: string } => {
  if (isTextPart(part)) return { type: 'text', text: 'TEXT' };
  if (isInlineDataPart(part)) return { type: 'image', text: 'IMAGE' };
  if (isFileDataPart(part)) return { type: 'system', text: 'FILE' };
  if (isFunctionCallPart(part)) return { type: 'tool', text: 'FUNCTION_CALL' };
  if (isFunctionResponsePart(part)) return { type: 'tool', text: 'FUNCTION_RESPONSE' };
  if (isExecutableCodePart(part)) return { type: 'thinking', text: 'CODE' };
  if (isCodeExecutionResultPart(part)) return { type: 'thinking', text: 'RESULT' };
  return { type: 'text', text: 'UNKNOWN' };
};

// 是否有多个parts
const hasMultipleParts = computed(() => parts.value.length > 1);
</script>

<template>
  <MessageItem
    :count="parts.length"
    :data-as-text="JSON.stringify(content, null, 2)"
    :id="id"
    :index="String(index)"
    :role="role === 'model' ? 'model' : role"
    storage-prefix="gemini-msg"
  >
    <div class="message-content-flow">
      <!-- 空内容 -->
      <div v-if="parts.length === 0" class="empty-state">
        No parts in this message
      </div>

      <!-- 单条内容：直接显示 -->
      <template v-if="!hasMultipleParts">
        <template v-for="(part, idx) in parts" :key="idx">
          <!-- Text Part -->
          <SmartViewer v-if="isTextPart(part)" :text="part.text" />

          <!-- Inline Data Part (Image) -->
          <ImageBlock
            v-else-if="isInlineDataPart(part)"
            :url="getInlineDataUrl(part)"
          />

          <!-- File Data Part -->
          <div v-else-if="isFileDataPart(part)" class="file-part">
            <div class="file-info">
              <span class="file-icon">📎</span>
              <span class="file-uri">{{ part.fileData.fileUri }}</span>
              <span class="file-mime">({{ part.fileData.mimeType }})</span>
            </div>
          </div>

          <!-- Function Call Part -->
          <GeminiFunctionCall
            v-else-if="isFunctionCallPart(part)"
            :data="part.functionCall"
          />

          <!-- Function Response Part -->
          <GeminiFunctionResponse
            v-else-if="isFunctionResponsePart(part)"
            :data="part.functionResponse"
          />

          <!-- Executable Code Part -->
          <div v-else-if="isExecutableCodePart(part)" class="code-part">
            <div class="code-header">
              <span class="code-icon">💻</span>
              <span class="code-lang">{{ part.executableCode.language }}</span>
            </div>
            <pre class="code-content">{{ part.executableCode.code }}</pre>
          </div>

          <!-- Code Execution Result Part -->
          <div v-else-if="isCodeExecutionResultPart(part)" class="result-part">
            <div class="result-header">
              <span class="result-icon">📊</span>
              <span
                class="result-outcome"
                :class="`outcome-${part.codeExecutionResult.outcome.toLowerCase()}`"
              >
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
      </template>

      <!-- 多条内容：使用 SubMessageItem -->
      <template v-else>
        <SubMessageItem
          v-for="(part, subIndex) in parts"
          :key="subIndex"
          :badge-type="getBadgeInfo(part).type"
          :badge-text="getBadgeInfo(part).text"
          :id="`${msgHashId}-part-${subIndex}`"
          :index="`${index}-${subIndex + 1}`"
          storage-prefix="gemini-sub"
        >
          <!-- Text Part -->
          <SmartViewer v-if="isTextPart(part)" :text="part.text" />

          <!-- Inline Data Part (Image) -->
          <ImageBlock
            v-else-if="isInlineDataPart(part)"
            :url="getInlineDataUrl(part)"
          />

          <!-- File Data Part -->
          <div v-else-if="isFileDataPart(part)" class="file-part">
            <div class="file-info">
              <span class="file-icon">📎</span>
              <span class="file-uri">{{ part.fileData.fileUri }}</span>
              <span class="file-mime">({{ part.fileData.mimeType }})</span>
            </div>
          </div>

          <!-- Function Call Part -->
          <GeminiFunctionCall
            v-else-if="isFunctionCallPart(part)"
            :data="part.functionCall"
          />

          <!-- Function Response Part -->
          <GeminiFunctionResponse
            v-else-if="isFunctionResponsePart(part)"
            :data="part.functionResponse"
          />

          <!-- Executable Code Part -->
          <div v-else-if="isExecutableCodePart(part)" class="code-part">
            <div class="code-header">
              <span class="code-icon">💻</span>
              <span class="code-lang">{{ part.executableCode.language }}</span>
            </div>
            <pre class="code-content">{{ part.executableCode.code }}</pre>
          </div>

          <!-- Code Execution Result Part -->
          <div v-else-if="isCodeExecutionResultPart(part)" class="result-part">
            <div class="result-header">
              <span class="result-icon">📊</span>
              <span
                class="result-outcome"
                :class="`outcome-${part.codeExecutionResult.outcome.toLowerCase()}`"
              >
                {{ part.codeExecutionResult.outcome }}
              </span>
            </div>
            <pre class="result-output">{{ part.codeExecutionResult.output }}</pre>
          </div>

          <!-- Unknown Part -->
          <div v-else class="part unknown-part">
            <pre>{{ JSON.stringify(part, null, 2) }}</pre>
          </div>
        </SubMessageItem>
      </template>
    </div>
  </MessageItem>
</template>

<style scoped>
.message-content-flow {
  padding: var(--llm-spacing-xs) 0;
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
