<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import type { Candidate } from '@/types/gemini/response';
import SmartViewer from '../../content/SmartViewer.vue';
import ImageBlock from '../../content/ImageBlock.vue';
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

interface Props {
  candidate: Candidate;
  index: number;
}

const props = defineProps<Props>();

const storageKey = computed(() => `gemini-candidate-${props.index}-open`);
const isOpen = useSessionStorage(storageKey, true);

const parts = computed(() => props.candidate.content?.parts || []);

// finish reason样式
const finishReasonClass = computed(() => {
  const reason = props.candidate.finishReason?.toLowerCase();
  if (!reason) return '';
  if (reason === 'stop') return 'finish-stop';
  if (reason === 'max_tokens') return 'finish-length';
  if (reason === 'safety') return 'finish-safety';
  if (reason === 'recitation') return 'finish-recitation';
  if (reason === 'other') return 'finish-other';
  return '';
});

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

// 获取citation数量
const citationCount = computed(() => {
  return props.candidate.citationMetadata?.citationSources?.length || 0;
});
</script>

<template>
  <div class="candidate" :class="{ 'is-open': isOpen }">
    <div class="candidate-header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index }}</span>
        <span v-if="candidate.finishReason" class="finish-reason" :class="finishReasonClass"
          :title="candidate.finishMessage"
        >
          {{ candidate.finishReason }}
        </span>
      </div>
      <div class="header-right">
        <span v-if="citationCount > 0" class="citation-count">{{ citationCount }} citation(s)</span>
        <span v-if="candidate.tokenCount" class="token-count">{{ candidate.tokenCount }} tokens</span>
      </div>
    </div>

    <div v-show="isOpen" class="candidate-content">
      <!-- Parts -->
      <div v-if="parts.length > 0" class="parts-section">
        <div class="section-title">Content Parts ({{ parts.length }})</div>
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
      </div>

      <!-- Citations -->
      <div v-if="candidate.citationMetadata?.citationSources?.length" class="citations-section">
        <div class="section-title"
          >Citations ({{ candidate.citationMetadata.citationSources.length }})</div
        >
        <div
          v-for="(citation, idx) in candidate.citationMetadata.citationSources"
          :key="idx"
          class="citation-item"
        >
          <a v-if="citation.uri" :href="citation.uri" target="_blank" class="citation-link"
            >{{ citation.title || citation.uri }}</a
          >
          <span v-else class="citation-text">{{ citation.title || 'Unknown source' }}</span>
          <span v-if="citation.license" class="citation-license">({{ citation.license }})</span>
        </div>
      </div>

      <!-- Grounding Metadata -->
      <div v-if="candidate.groundingMetadata" class="grounding-section">
        <div class="section-title">Grounding</div>
        <div v-if="candidate.groundingMetadata.groundingChunks?.length" class="grounding-chunks"
          >
          <div
            v-for="(chunk, idx) in candidate.groundingMetadata.groundingChunks"
            :key="idx"
            class="grounding-chunk"
          >
            <a
              v-if="chunk.web?.uri"
              :href="chunk.web.uri"
              target="_blank"
              class="chunk-link"
              >{{ chunk.web.title || chunk.web.uri }}</a
            >
            <span v-else-if="chunk.retrievedContext" class="chunk-context"
              >{{ chunk.retrievedContext.title }}</span
            >
          </div>
        </div>
      </div>

      <!-- Safety Ratings -->
      <div v-if="candidate.safetyRatings?.length" class="safety-section">
        <div class="section-title">Safety Ratings ({{ candidate.safetyRatings.length }})</div>
        <div class="safety-list">
          <div
            v-for="(rating, idx) in candidate.safetyRatings"
            :key="idx"
            class="safety-item"
            :class="{ 'is-blocked': rating.blocked }"
          >
            <span class="safety-category">{{ rating.category }}</span>
            <span class="safety-probability" :class="`prob-${rating.probability.toLowerCase()}`"
              >{{ rating.probability }}</span
            >
            <span v-if="rating.blocked" class="blocked-badge">BLOCKED</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.candidate {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.candidate-header {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  transition: background-color 0.2s;
}

.candidate-header:hover {
  background: #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle {
  color: #64748b;
  font-size: 0.9rem;
}

.index {
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
}

.finish-reason {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
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

.finish-safety {
  background: #fee2e2;
  color: #991b1b;
}

.finish-recitation {
  background: #e0e7ff;
  color: #3730a3;
}

.finish-other {
  background: #f3f4f6;
  color: #4b5563;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.citation-count,
.token-count {
  font-size: 0.85rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.candidate-content {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Part styles */
.parts-section {
  margin-bottom: 20px;
}

.part {
  margin-bottom: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #cbd5e1;
}

.part:last-child {
  margin-bottom: 0;
}

.text-part {
  border-left-color: #3b82f6;
}

.media-part {
  border-left-color: #10b981;
}

.file-part {
  border-left-color: #f59e0b;
}

.function-call-part {
  border-left-color: #8b5cf6;
  background: #faf5ff;
}

.function-response-part {
  border-left-color: #06b6d4;
  background: #ecfeff;
}

.code-part {
  border-left-color: #1e293b;
  background: #1e1e1e;
}

.result-part {
  border-left-color: #22c55e;
  background: #f0fdf4;
}

.media-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 8px;
}

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
}

.file-mime {
  color: #64748b;
  font-size: 0.85rem;
}

.function-header,
.code-header,
.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
}

.function-icon,
.code-icon,
.result-icon {
  font-size: 1.1rem;
}

.function-name {
  color: #7c3aed;
  font-family: var(--llm-font-mono);
}

.function-args,
.function-response {
  margin: 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  font-family: var(--llm-font-mono);
  font-size: 0.9rem;
  overflow-x: auto;
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
}

.result-outcome {
  text-transform: uppercase;
  font-size: 0.85rem;
  padding: 2px 6px;
  border-radius: 3px;
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

/* Citations */
.citations-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.citation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 8px;
}

.citation-item:last-child {
  margin-bottom: 0;
}

.citation-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.citation-link:hover {
  text-decoration: underline;
}

.citation-text {
  color: #64748b;
}

.citation-license {
  color: #9ca3af;
  font-size: 0.85rem;
}

/* Grounding */
.grounding-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.grounding-chunks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grounding-chunk {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
}

.chunk-link {
  color: #0284c7;
  text-decoration: none;
  font-weight: 500;
}

.chunk-link:hover {
  text-decoration: underline;
}

.chunk-context {
  color: #64748b;
}

/* Safety ratings */
.safety-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.safety-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.safety-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.safety-item.is-blocked {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.safety-category {
  font-weight: 500;
  color: #374151;
  flex: 1;
}

.safety-probability {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
}

.prob-negligible {
  background: #dcfce7;
  color: #166534;
}

.prob-low {
  background: #dbeafe;
  color: #1e40af;
}

.prob-medium {
  background: #fef3c7;
  color: #92400e;
}

.prob-high {
  background: #fee2e2;
  color: #991b1b;
}

.blocked-badge {
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
