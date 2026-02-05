<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '@/utils/format/formatDate';
import type { GeminiResponse } from '@/types/gemini/response';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import TokenUsage from '../shared/TokenUsage.vue';
import ProseContent from '../shared/ProseContent.vue';

interface Props {
  data: GeminiResponse;
}

const props = defineProps<Props>();

const candidates = computed(() => {
  return props.data.candidates || [];
});

const firstCandidate = computed(() => {
  return candidates.value[0] || null;
});

const promptFeedback = computed(() => {
  return props.data.promptFeedback;
});

const usage = computed(() => {
  if (!props.data.usageMetadata) return null;
  const meta = props.data.usageMetadata;
  return {
    input_tokens: meta.promptTokenCount,
    output_tokens: meta.candidatesTokenCount,
    total_tokens: meta.totalTokenCount,
    cache_read_input_tokens: meta.cachedContentTokenCount
  };
});

const finishReasonClass = (reason: string | undefined) => {
  if (!reason) return '';
  const r = reason.toLowerCase();
  if (r === 'stop') return 'finish-stop';
  if (r === 'max_tokens') return 'finish-length';
  if (r === 'safety') return 'finish-content-filter';
  if (r === 'recitation') return 'finish-content-filter';
  if (r === 'other') return 'finish-length';
  return '';
};
</script>

<template>
  <div class="gemini-response-view">
    <CollapsibleSection v-if="promptFeedback" title="Prompt Feedback" :default-open="true">
      <div class="prompt-feedback">
        <span v-if="promptFeedback.blockReason" class="block-reason">
          Blocked: {{ promptFeedback.blockReason }}
        </span>
        <div v-if="promptFeedback.safetyRatings?.length > 0" class="safety-ratings">
          <div v-for="(rating, index) in promptFeedback.safetyRatings" :key="index" class="safety-rating">
            <span class="safety-category">{{ rating.category }}</span>
            <span class="safety-probability">{{ rating.probability }}</span>
          </div>
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Basic Info" :default-open="true">
      <InfoItem label="Response ID" :value="data.responseId" />
      <InfoItem label="Model Version" :value="data.modelVersion" />
      <InfoItem label="Candidates" :value="candidates.length" />
    </CollapsibleSection>

    <CollapsibleSection v-if="usage" title="Token Usage" :default-open="true">
      <TokenUsage :usage="usage" variant="default" />
    </CollapsibleSection>

    <CollapsibleSection title="Candidates" :count="candidates.length" :default-open="true">
      <div v-if="candidates.length === 0" class="empty-state">
        No candidates
      </div>
      <div v-for="(candidate, index) in candidates" :key="index" class="candidate-item">
        <div class="candidate-header">
          <span class="candidate-index">Candidate #{{ index + 1 }}</span>
          <span v-if="candidate.finishReason" class="finish-reason-badge" :class="finishReasonClass(candidate.finishReason)">
            {{ candidate.finishReason }}
          </span>
          <span v-if="candidate.tokenCount" class="token-count">
            {{ candidate.tokenCount }} tokens
          </span>
        </div>

        <div v-if="candidate.avgLogprobs" class="avg-logprobs">
          Avg Logprobs: {{ candidate.avgLogprobs.toFixed(4) }}
        </div>

        <div v-if="candidate.finishMessage" class="finish-message">
          {{ candidate.finishMessage }}
        </div>

        <div class="candidate-content">
          <div v-for="(part, partIndex) in candidate.content.parts" :key="partIndex" class="part-item">
            <div v-if="part.text" class="text-part">
              <ProseContent :content="part.text" />
            </div>

            <div v-else-if="part.functionCall" class="function-call-part">
              <span class="function-badge">function_call</span>
              <span class="function-name">{{ part.functionCall.name }}</span>
              <span v-if="part.thoughtSignature" class="thought-badge">✓ thought</span>
              <pre class="function-args">{{ JSON.stringify(part.functionCall.args, null, 2) }}</pre>
            </div>

            <div v-else-if="part.functionResponse" class="function-response-part">
              <span class="function-badge">function_response</span>
              <span class="function-name">{{ part.functionResponse.name }}</span>
              <pre class="function-args">{{ JSON.stringify(part.functionResponse.response, null, 2) }}</pre>
            </div>

            <div v-else-if="part.executableCode" class="executable-code-part">
              <span class="code-badge">executable_code</span>
              <span class="code-language">{{ part.executableCode.language }}</span>
              <pre class="code-block">{{ part.executableCode.code }}</pre>
            </div>

            <div v-else-if="part.codeExecutionResult" class="code-execution-part">
              <span class="code-badge">code_execution_result</span>
              <span class="code-outcome">{{ part.codeExecutionResult.outcome }}</span>
              <pre v-if="part.codeExecutionResult.output" class="code-output">{{ part.codeExecutionResult.output }}</pre>
            </div>

            <div v-else-if="part.inlineData" class="inline-data-part">
              <span class="data-badge">inline_data</span>
              <span class="data-mime">{{ part.inlineData.mimeType }}</span>
              <span class="data-preview">({{ part.inlineData.data.length }} bytes)</span>
            </div>

            <div v-else-if="part.fileData" class="file-data-part">
              <span class="data-badge">file_data</span>
              <span class="data-mime">{{ part.fileData.mimeType }}</span>
              <span class="data-uri">{{ part.fileData.fileUri }}</span>
            </div>
          </div>
        </div>

        <div v-if="candidate.citationMetadata?.citationSources?.length > 0" class="citation-section">
          <h4>Citations</h4>
          <div v-for="(source, idx) in candidate.citationMetadata.citationSources" :key="idx" class="citation-source">
            <span v-if="source.startIndex !== undefined" class="citation-range">
              [{{ source.startIndex }}-{{ source.endIndex }}]
            </span>
            <span v-if="source.uri" class="citation-uri">{{ source.uri }}</span>
            <span v-if="source.license" class="citation-license">{{ source.license }}</span>
          </div>
        </div>

        <div v-if="candidate.groundingMetadata" class="grounding-section">
          <h4>Grounding</h4>
          <div v-if="candidate.groundingMetadata.groundingChunks?.length > 0" class="grounding-chunks">
            <div v-for="(chunk, idx) in candidate.groundingMetadata.groundingChunks" :key="idx" class="grounding-chunk">
              <span v-if="chunk.web?.uri" class="grounding-uri">{{ chunk.web.uri }}</span>
              <span v-if="chunk.retrievedContext?.title" class="grounding-title">{{ chunk.retrievedContext.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Full Response" :default-open="false">
      <JsonViewer :data="data" :collapsible="true" />
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.gemini-response-view {
  padding: 2px;
}

.prompt-feedback {
  padding: 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.block-reason {
  display: block;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 8px;
}

.safety-ratings {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.safety-rating {
  display: flex;
  gap: 12px;
  padding: 6px;
  background: rgba(254, 202, 202, 0.2);
  border-radius: 4px;
}

.safety-category {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.8rem;
}

.safety-probability {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #dc2626;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 40px 20px;
}

.candidate-item {
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.candidate-header {
  background: #f8fafc;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.candidate-index {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.token-count {
  font-size: 0.75rem;
  color: #64748b;
}

.finish-reason-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
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
  background: #dbeafe;
  color: #1e40af;
}

.finish-content-filter {
  background: #fecaca;
  color: #991b1b;
}

.avg-logprobs,
.finish-message {
  padding: 8px 16px;
  font-size: 0.8rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.candidate-content {
  padding: 16px;
}

.part-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.text-part {
  /* Text content styling handled by ProseContent */
}

.function-call-part,
.function-response-part {
  border-left: 3px solid #7c3aed;
}

.function-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #7c3aed;
  color: white;
}

.function-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', monospace;
  margin-left: 8px;
}

.thought-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  background: #fef3c7;
  color: #92400e;
  margin-left: 8px;
}

.function-args {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin-top: 8px;
}

.function-args pre {
  margin: 0;
}

.executable-code-part,
.code-execution-part {
  border-left: 3px solid #d97706;
}

.code-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #d97706;
  color: white;
}

.code-language {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', monospace;
  margin-left: 8px;
}

.code-block {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin-top: 8px;
}

.code-block pre {
  margin: 0;
}

.code-outcome {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
  margin-left: 8px;
}

.code-output {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin-top: 8px;
}

.inline-data-part,
.file-data-part {
  border-left: 3px solid #3b82f6;
}

.data-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #3b82f6;
  color: white;
}

.data-mime {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #1e293b;
  font-size: 0.8rem;
  margin-left: 8px;
}

.data-preview,
.data-uri {
  color: #64748b;
  font-size: 0.8rem;
  margin-left: 8px;
}

.citation-section,
.grounding-section {
  margin-top: 16px;
  padding: 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #86efac;
}

.citation-section h4,
.grounding-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #166534;
  font-weight: 600;
}

.citation-source,
.grounding-chunk {
  display: flex;
  gap: 12px;
  padding: 6px;
  background: rgba(134, 239, 172, 0.2);
  border-radius: 4px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.citation-range {
  font-weight: 600;
  color: #166534;
}

.citation-uri,
.grounding-uri {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #1e40af;
  font-size: 0.8rem;
}

.citation-license {
  color: #64748b;
  font-size: 0.8rem;
}

.grounding-title {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.8rem;
}
</style>
