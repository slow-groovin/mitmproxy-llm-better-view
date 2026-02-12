<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import type { Candidate } from '@/types/gemini/response';
import GeminiPart from './GeminiPart.vue';

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
        <!-- Parts count moved to header -->
      </div>
      <div class="header-right">
        <span v-if="citationCount > 0" class="citation-count">{{ citationCount }} citation(s)</span>
        <span v-if="candidate.tokenCount" class="token-count">{{ candidate.tokenCount }} tokens</span>
      </div>
    </div>

    <div v-show="isOpen" class="candidate-content">
      <!-- Parts - using GeminiPart component for each part -->
      <div v-if="parts.length > 0" class="parts-section">
        <GeminiPart
          v-for="(part, idx) in parts"
          :key="idx"
          :part="part"
          :index="idx"
        />
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
  font-size: 1.5rem;
}

.finish-reason {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 1.5rem;
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
  padding: 6px;
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

/* Parts section */
.parts-section {
  margin-bottom: 20px;
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
