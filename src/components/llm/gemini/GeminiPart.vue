<script setup lang="ts">
import { computed } from 'vue';
import type {
  Part,
  TextPart,
  InlineDataPart,
  FileDataPart,
  FunctionCallPart,
  FunctionResponsePart,
  ExecutableCodePart,
  CodeExecutionResultPart,
} from '@/types/gemini/request';
import SmartViewer from '@/components/content/SmartViewer.vue';
import ImageBlock from '@/components/content/ImageBlock.vue';
import GeminiToolUseArgs from './GeminiToolUseArgs.vue';

interface Props {
  part: Part;
  index: number;
}

const props = defineProps<Props>();

// Type guards
const isTextPart = (part: Part): part is TextPart => 'text' in part;
const isInlineDataPart = (part: Part): part is InlineDataPart => 'inlineData' in part;
const isFileDataPart = (part: Part): part is FileDataPart => 'fileData' in part;
const isFunctionCallPart = (part: Part): part is FunctionCallPart => 'functionCall' in part;
const isFunctionResponsePart = (part: Part): part is FunctionResponsePart => 'functionResponse' in part;
const isExecutableCodePart = (part: Part): part is ExecutableCodePart => 'executableCode' in part;
const isCodeExecutionResultPart = (part: Part): part is CodeExecutionResultPart => 'codeExecutionResult' in part;

// Get part type label for badge display
const partTypeLabel = computed(() => {
  if (isTextPart(props.part)) return 'TEXT';
  if (isInlineDataPart(props.part)) return 'MEDIA';
  if (isFileDataPart(props.part)) return 'FILE';
  if (isFunctionCallPart(props.part)) return 'TOOL';
  if (isFunctionResponsePart(props.part)) return 'RESPONSE';
  if (isExecutableCodePart(props.part)) return 'CODE';
  if (isCodeExecutionResultPart(props.part)) return 'RESULT';
  return 'UNKNOWN';
});

// Get part type class for container styling
const partTypeClass = computed(() => {
  if (isTextPart(props.part)) return 'type-text';
  if (isInlineDataPart(props.part)) return 'type-media';
  if (isFileDataPart(props.part)) return 'type-file';
  if (isFunctionCallPart(props.part)) return 'type-tool';
  if (isFunctionResponsePart(props.part)) return 'type-response';
  if (isExecutableCodePart(props.part)) return 'type-code';
  if (isCodeExecutionResultPart(props.part)) return 'type-result';
  return 'type-unknown';
});

// Get badge type class for badge background/text colors
const badgeTypeClass = computed(() => {
  if (isTextPart(props.part)) return 'badge-text';
  if (isInlineDataPart(props.part)) return 'badge-media';
  if (isFileDataPart(props.part)) return 'badge-file';
  if (isFunctionCallPart(props.part)) return 'badge-tool';
  if (isFunctionResponsePart(props.part)) return 'badge-response';
  if (isExecutableCodePart(props.part)) return 'badge-code';
  if (isCodeExecutionResultPart(props.part)) return 'badge-result';
  return 'badge-unknown';
});

// Get inline data URL for media parts
const getInlineDataUrl = (part: InlineDataPart): string => {
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
};

// Get tool name for function call parts
const toolName = computed(() => {
  if (isFunctionCallPart(props.part)) {
    return props.part.functionCall.name;
  }
  return undefined;
});

// Get tool args for function call parts
const toolArgs = computed(() => {
  if (isFunctionCallPart(props.part)) {
    return props.part.functionCall.args;
  }
  return undefined;
});
</script>

<template>
  <div class="content-part" :class="partTypeClass">
    <!-- Part Header - Compact style -->
    <div class="part-header">
      <div class="header-left">
        <span class="part-type-badge" :class="badgeTypeClass">{{ partTypeLabel }}</span>
        <span class="part-index">#{{ index + 1 }}</span>
        <span v-if="toolName" class="part-name">{{ toolName }}</span>
      </div>
    </div>

    <!-- Part Content -->
    <div class="part-content">
      <!-- Text Part -->
      <template v-if="isTextPart(part)">
        <SmartViewer :text="part.text" />
      </template>

      <!-- Inline Data Part (Image) -->
      <template v-else-if="isInlineDataPart(part)">
        <div class="media-label">{{ part.inlineData.mimeType }}</div>
        <ImageBlock :url="getInlineDataUrl(part)" />
      </template>

      <!-- File Data Part -->
      <template v-else-if="isFileDataPart(part)">
        <div class="file-info">
          <span class="file-icon">📎</span>
          <span class="file-uri">{{ part.fileData.fileUri }}</span>
          <span class="file-mime">({{ part.fileData.mimeType }})</span>
        </div>
      </template>

      <!-- Function Call Part - Using GeminiToolUseArgs like ClaudeToolUseArgs -->
      <template v-else-if="isFunctionCallPart(part)">
        <GeminiToolUseArgs v-if="toolArgs" :input="toolArgs" />
      </template>

      <!-- Function Response Part -->
      <template v-else-if="isFunctionResponsePart(part)">
        <div class="response-header">
          <span class="response-name">{{ part.functionResponse.name }}</span>
        </div>
        <pre class="response-content">{{ JSON.stringify(part.functionResponse.response, null, 2) }}</pre>
      </template>

      <!-- Executable Code Part -->
      <template v-else-if="isExecutableCodePart(part)">
        <div class="code-header">
          <span class="code-lang">{{ part.executableCode.language }}</span>
        </div>
        <pre class="code-content">{{ part.executableCode.code }}</pre>
      </template>

      <!-- Code Execution Result Part -->
      <template v-else-if="isCodeExecutionResultPart(part)">
        <div class="result-header">
          <span
            class="result-outcome"
            :class="`outcome-${part.codeExecutionResult.outcome.toLowerCase()}`"
          >
            {{ part.codeExecutionResult.outcome }}
          </span>
        </div>
        <pre class="result-output">{{ part.codeExecutionResult.output }}</pre>
      </template>

      <!-- Unknown Part -->
      <template v-else>
        <pre class="unknown-content">{{ JSON.stringify(part, null, 2) }}</pre>
      </template>
    </div>
  </div>
</template>

<style scoped>
.content-part {
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.content-part:last-child {
  margin-bottom: 0;
}


/* Header */
.part-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.part-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-text {
  background: #dbeafe;
  color: #1e40af;
}

.badge-media {
  background: #d1fae5;
  color: #065f46;
}

.badge-file {
  background: #fef3c7;
  color: #92400e;
}

.badge-tool {
  background: #ede9fe;
  color: #5b21b6;
}

.badge-response {
  background: #cffafe;
  color: #155e75;
}

.badge-code {
  background: #e2e8f0;
  color: #1e293b;
}

.badge-result {
  background: #dcfce7;
  color: #166534;
}

.badge-unknown {
  background: #f1f5f9;
  color: #64748b;
}

.part-index {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.part-name {
  font-family: var(--llm-font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 2px 8px;
  border-radius: 4px;
}

/* Content */
.part-content {
  padding: 12px;
}

/* Media label */
.media-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 8px;
}

/* File info */
.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.file-icon {
  font-size: 1.2rem;
}

.file-uri {
  font-family: var(--llm-font-mono);
  color: #374151;
  word-break: break-all;
}

.file-mime {
  color: #64748b;
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Response header */
.response-header {
  margin-bottom: 8px;
}

.response-name {
  font-family: var(--llm-font-mono);
  font-weight: 600;
  color: #0891b2;
}

.response-content {
  margin: 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  font-family: var(--llm-font-mono);
  font-size: 0.9rem;
  overflow-x: auto;
}

/* Code styles */
.code-header {
  margin-bottom: 8px;
}

.code-lang {
  color: #9cdcfe;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.code-content {
  margin: 0;
  font-family: var(--llm-font-mono);
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #d4d4d4;
  background: #1e1e1e;
  padding: 12px;
  border-radius: 4px;
}

/* Result styles */
.result-header {
  margin-bottom: 8px;
}

.result-outcome {
  text-transform: uppercase;
  font-size: 0.85rem;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}

.outcome-success {
  background: #dcfce7;
  color: #166534;
}

.outcome-failure,
.outcome-error {
  background: #fee2e2;
  color: #991b1b;
}

.result-output {
  margin: 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  font-family: var(--llm-font-mono);
  font-size: 0.9rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Unknown content */
.unknown-content {
  margin: 0;
  font-family: var(--llm-font-mono);
  font-size: 0.85rem;
  overflow-x: auto;
  background: #f1f5f9;
  padding: 12px;
  border-radius: 4px;
}
</style>
