<script setup lang="ts">
import { computed } from 'vue';
import type { GeminiResponse } from '../../../types/gemini/response';
import CollapsibleSection from '../../container/CollapsibleSection.vue';
import LabelValueRow from '../../content/LabelValueRow.vue';
import GeminiTokenUsage from './GeminiTokenUsage.vue';
import GeminiCandidate from './GeminiCandidate.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '../../content/SmartViewer.vue';

interface Props {
  data: GeminiResponse;
}

const props = defineProps<Props>();

const candidates = computed(() => props.data.candidates || []);

const totalTokens = computed(() => {
  return props.data.usageMetadata?.totalTokenCount || 0;
});

// Finish reason class for styling
const finishReasonClass = (reason: string | null | undefined) => {
  if (!reason) return '';
  const r = reason.toLowerCase();
  if (r === 'stop') return 'finish-stop';
  if (r === 'max_tokens') return 'finish-length';
  if (r === 'safety') return 'finish-safety';
  if (r === 'recitation') return 'finish-recitation';
  if (r === 'other') return 'finish-other';
  return '';
};

// Get finish reason summary
const getFinishReasonSummary = () => {
  const reasons = candidates.value
    .map(c => c.finishReason)
    .filter((r): r is string => !!r);
  if (reasons.length === 0) return '';
  const unique = [...new Set(reasons)];
  return unique.join(', ');
};

// Check if has prompt feedback
const promptFeedbackInfo = computed(() => {
  if (!props.data.promptFeedback) return null;
  return {
    blockReason: props.data.promptFeedback.blockReason,
    safetyRatingsCount: props.data.promptFeedback.safetyRatings?.length || 0,
  };
});

// Check if has error-like block reason
const hasSafetyBlock = computed(() => {
  return candidates.value.some(c =>
    c.finishReason?.toLowerCase() === 'safety' ||
    c.finishReason?.toLowerCase() === 'recitation'
  );
});
</script>

<template>
  <div class="gemini-response-view">
    <div class="header">
      <h2>Gemini API Response</h2>
      <div class="meta">
        <code v-if="data.modelVersion">{{ data.modelVersion }}</code>
        <span v-else>Unknown Model</span>
        <span class="divider">·</span>
        <span>{{ totalTokens.toLocaleString() }} tokens</span>
        <span v-if="getFinishReasonSummary()" class="divider">·</span>
        <span v-if="getFinishReasonSummary()">
          finish: <span class="finish-summary" :class="finishReasonClass(getFinishReasonSummary())">{{ getFinishReasonSummary() }}</span>
        </span>
      </div>
    </div>

    <!-- Safety Block Warning -->
    <CollapsibleSection
      v-if="hasSafetyBlock"
      title="Safety Block Detected"
      :default-open="true"
      storage-key="gemini-safety-block"
      variant="error"
    >
      <div class="safety-warning">
        <div class="warning-title">Content generation was blocked</div>
        <div class="warning-text">
          One or more candidates were blocked due to safety settings or recitation policy.
          Check individual candidate details for more information.
        </div>
      </div>
    </CollapsibleSection>

    <!-- Prompt Feedback Section -->
    <CollapsibleSection
      v-if="promptFeedbackInfo"
      title="Prompt Feedback"
      :default-open="true"
      storage-key="gemini-prompt-feedback"
      variant="system"
    >
      <LabelValueRow
        label="Block Reason"
        :value="promptFeedbackInfo.blockReason || 'None'"
        :formatter="(v) => v === 'None' ? 'Not blocked' : String(v)"
      />
      <div v-if="data.promptFeedback?.safetyRatings?.length" class="safety-list">
        <div
          v-for="(rating, idx) in data.promptFeedback.safetyRatings"
          :key="idx"
          class="safety-item"
          :class="{ 'is-blocked': rating.blocked }"
        >
          <span class="safety-category">{{ rating.category }}</span>
          <span
            class="safety-probability"
            :class="`prob-${rating.probability.toLowerCase()}`"
          >
            {{ rating.probability }}
          </span>
          <span v-if="rating.blocked" class="blocked-badge">BLOCKED</span>
        </div>
      </div>
    </CollapsibleSection>

    <!-- Token Usage Section -->
    <CollapsibleSection
      v-if="data.usageMetadata"
      title="Token Usage"
      :default-open="true"
      storage-key="gemini-token-usage"
    >
      <GeminiTokenUsage :usage="data.usageMetadata" />
    </CollapsibleSection>

    <!-- Candidates Section -->
    <CollapsibleSection
      title="Candidates"
      :count="candidates.length"
      :default-open="true"
      storage-key="gemini-candidates"
      variant="default"
    >
      <div v-if="candidates.length === 0" class="empty-state">
        No candidates
      </div>
      <GeminiCandidate
        v-for="candidate in candidates"
        :key="candidate.index"
        :candidate="candidate"
        :index="candidate.index"
        :finish-reason-class="finishReasonClass"
        :show-header="candidates.length > 1"
      />
    </CollapsibleSection>

    <!-- Response Info -->
    <CollapsibleSection
      title="Response Info"
      :default-open="false"
      storage-key="gemini-response-info"
    >
      <LabelValueRow label="Model Version" :value="data.modelVersion" />
      <LabelValueRow label="Response ID" :value="data.responseId" />
    </CollapsibleSection>

    <BetterDetails title="Full Response">
      <SmartViewer :text="JSON.stringify(data, null, 2)" />
    </BetterDetails>
  </div>
</template>

<style scoped>
.gemini-response-view {
  padding: var(--llm-spacing-sm);
}

.header {
  margin-bottom: var(--llm-spacing-2xl);
}

.header h2 {
  margin: 0 0 var(--llm-spacing-md) 0;
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--llm-spacing-md);
  font-size: 14px;
  color: #6b7280;
  flex-wrap: wrap;
}

.meta code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: var(--llm-radius-sm);
  font-size: 13px;
  font-family: var(--llm-font-mono);
  color: #374151;
}

.divider {
  color: #d1d5db;
}

.empty-state {
  text-align: center;
  color: var(--llm-text-secondary);
  font-style: italic;
  padding: 40px 20px;
}

.finish-summary {
  padding: 2px 8px;
  border-radius: var(--llm-radius-md);
  font-size: 12px;
  font-weight: 500;
}

.finish-stop {
  background: var(--llm-finish-stop-bg);
  color: var(--llm-finish-stop-text);
}

.finish-length {
  background: var(--llm-finish-length-bg);
  color: var(--llm-finish-length-text);
}

.finish-safety {
  background: var(--llm-finish-filter-bg);
  color: var(--llm-finish-filter-text);
}

.finish-recitation {
  background: #e0e7ff;
  color: #3730a3;
}

.finish-other {
  background: #f3f4f6;
  color: #4b5563;
}

/* Safety Block Warning Styles */
.safety-warning {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.warning-title {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 8px;
}

.warning-text {
  color: #7f1d1d;
  font-size: 14px;
  line-height: 1.5;
}

/* Safety list styles */
.safety-list {
  margin-top: 12px;
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
