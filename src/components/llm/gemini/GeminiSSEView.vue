<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '../../../utils/format/formatDate';
import type { ParsedSSEChunk } from '../../../types/gemini/sse';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import TokenUsage from '../shared/TokenUsage.vue';

interface Props {
  chunks: ParsedSSEChunk[];
}

const props = defineProps<Props>();

const validChunks = computed(() => {
  return props.chunks.filter(c => c.type === 'chunk' && c.data);
});

const firstChunk = computed(() => {
  return validChunks.value[0]?.data;
});

const lastChunk = computed(() => {
  return validChunks.value[validChunks.value.length - 1]?.data;
});

const modelVersion = computed(() => {
  return firstChunk.value?.modelVersion || lastChunk.value?.modelVersion;
});

const responseId = computed(() => {
  return firstChunk.value?.responseId || lastChunk.value?.responseId;
});

// Aggregate usage from all chunks
const aggregatedUsage = computed(() => {
  const usage = {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
    totalTokenCount: 0,
    cachedContentTokenCount: 0
  };

  for (const chunk of validChunks.value) {
    const chunkUsage = chunk.data?.usageMetadata;
    if (chunkUsage) {
      usage.promptTokenCount += chunkUsage.promptTokenCount || 0;
      usage.candidatesTokenCount += chunkUsage.candidatesTokenCount || 0;
      usage.totalTokenCount += chunkUsage.totalTokenCount || 0;
      usage.cachedContentTokenCount += chunkUsage.cachedContentTokenCount || 0;
    }
  }

  return {
    input_tokens: usage.promptTokenCount,
    output_tokens: usage.candidatesTokenCount,
    total_tokens: usage.totalTokenCount,
    cache_read_input_tokens: usage.cachedContentTokenCount
  };
});

// Aggregate streaming content
const streamedContent = computed(() => {
  const parts: string[] = [];
  for (const chunk of validChunks.value) {
    for (const candidate of chunk.data?.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          parts.push(part.text);
        }
      }
    }
  }
  return parts.join('');
});

// Aggregate function calls
const functionCalls = computed(() => {
  const calls: any[] = [];
  for (const chunk of validChunks.value) {
    for (const candidate of chunk.data?.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.functionCall) {
          calls.push({
            ...part.functionCall,
            thoughtSignature: part.thoughtSignature
          });
        }
      }
    }
  }
  return calls;
});

// Aggregate code execution results
const codeResults = computed(() => {
  const results: any[] = [];
  for (const chunk of validChunks.value) {
    for (const candidate of chunk.data?.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.executableCode) {
          results.push({ type: 'executable_code', ...part.executableCode });
        }
        if (part.codeExecutionResult) {
          results.push({ type: 'code_execution_result', ...part.codeExecutionResult });
        }
      }
    }
  }
  return results;
});

const hasPromptFeedback = computed(() => {
  return validChunks.value.some(c => c
.data?.promptFeedback?.blockReason);
});

const promptFeedback = computed(() => {
  return validChunks.value.find(c => c.data?.promptFeedback)?.data?.promptFeedback;
});
</script>

<template>
  <div class="gemini-sse-view">
    <CollapsibleSection v-if="hasPromptFeedback && promptFeedback" title="Prompt Feedback" :default-open="true">
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
      <InfoItem label="Response ID" :value="responseId" />
      <InfoItem label="Model Version" :value="modelVersion" />
      <InfoItem label="Event Count" :value="chunks.length" />
      <InfoItem label="Valid Chunks" :value="validChunks.length" />
    </CollapsibleSection>

    <CollapsibleSection v-if="Object.values(aggregatedUsage).some(v => v > 0)" title="Token Usage" :default-open="true">
      <TokenUsage :usage="aggregatedUsage" variant="default" />
    </CollapsibleSection>

    <CollapsibleSection v-if="streamedContent" title="Streamed Content" :default-open="true">
      <pre class="streamed-content">{{ streamedContent }}</pre>
    </CollapsibleSection>

    <CollapsibleSection v-if="functionCalls.length > 0" title="Function Calls" :count="functionCalls.length" variant="tools">
      <div v-for="(call, index) in functionCalls" :key="index" class="function-call-item">
        <div class="function-call-header">
          <span class="function-badge">function_call</span>
          <span class="function-name">{{ call.name }}</span>
          <span v-if="call.thoughtSignature" class="thought-badge">✓ thought</span>
        </div>
        <pre class="function-args">{{ JSON.stringify(call.args, null, 2) }}</pre>
      </div>
    </CollapsibleSection>

    <CollapsibleSection v-if="codeResults.length > 0" title="Code Execution" :count="codeResults.length" variant="default">
      <div v-for="(result, index) in codeResults" :key="index" class="code-result-item">
        <div v-if="result.type === 'executable_code'" class="code-exec-item">
          <div class="code-header">
            <span class="code-badge">executable_code</span>
            <span class="code-language">{{ result.language }}</span>
          </div>
          <pre class="code-block">{{ result.code }}</pre>
        </div>
        <div v-else-if="result.type === 'code_execution_result'" class="code-result-sub-item">
          <div class="code-header">
            <span class="code-badge">code_execution_result</span>
            <span class="code-outcome">{{ result.outcome }}</span>
          </div>
          <pre v-if="result.output" class="code-output">{{ result.output }}</pre>
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Raw Events" :default-open="false">
      <div class="events-timeline">
        <div v-for="(chunk, index) in chunks" :key="index" class="event-item">
          <div class="event-header">
            <span class="event-type-badge">{{ chunk.type }}</span>
            <span v-if="chunk.nonce" class="event-nonce">{{ chunk.nonce.slice(0, 8) }}</span>
          </div>
          <div v-if="chunk.data" class="event-content">
            <JsonViewer :data="chunk.data" :collapsible="true" />
          </div>
          <div v-else class="event-content raw">
            <pre>{{ chunk.raw }}</pre>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.gemini-sse-view {
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
  font-size: 1.2800000000000002rem;
}

.safety-probability {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #dc2626;
  font-size: 1.2800000000000002rem;
}

.streamed-content {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  font-size: 1.4rem;
  white-space: pre-wrap;
  overflow-x: auto;
  line-height: 1.6;
}

.function-call-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #faf5ff;
  border-radius: 6px;
  border-left: 3px solid #7c3aed;
}

.function-call-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.function-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #7c3aed;
  color: white;
}

.function-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.thought-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  background: #fef3c7;
  color: #92400e;
}

.function-args {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 1.2800000000000002rem;
  overflow-x: auto;
}

.function-args pre {
  margin: 0;
}

.code-result-item {
  margin-bottom: 16px;
}

.code-exec-item {
  padding: 12px;
  background: #fffbeb;
  border-radius: 6px;
  border-left: 3px solid #d97706;
}

.code-result-sub-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #6b7280;
}

.code-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.code-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #d97706;
  color: white;
}

.code-language {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.code-outcome {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
}

.code-block {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 1.2800000000000002rem;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
}

.code-output {
  font-family: 'Monaco', 'Menlo', mon;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 1.2800000000000002rem;
  overflow-x: auto;
}

.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-item {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.event-header {
  background: #f8fafc;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  width: 100%;
  text-align: left;
}

.event-header:hover {
  background: #f1f5f9;
}

.event-type-badge {
  background: #e5e7eb;
  color: #374151;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1.2rem;
  font-weight: 500;
}

.event-nonce {
  font-size: 1.2000000000000002rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.event-content {
  padding: 12px;
}

.event-content.raw {
  /* font-family: 'Monaco', 'Menlo', monospace; */
  background: #1e293b;
  color: #e2e8f0;
}

.event-content.raw pre {
  margin: 0;
  white-space: pre-wrap;
}
</style>
