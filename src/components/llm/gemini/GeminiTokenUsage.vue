<script setup lang="ts">
import type { UsageMetadata } from '@/types/gemini/common';

interface Props {
  usage: UsageMetadata;
}

defineProps<Props>();
</script>

<template>
  <div class="token-usage">
    <!-- Main token counts -->
    <div class="token-grid">
      <div class="token-box">
        <div class="token-label">Prompt Tokens</div>
        <div class="token-value">{{ usage.promptTokenCount.toLocaleString() }}</div>
      </div>
      <div class="token-box">
        <div class="token-label">Candidate Tokens</div>
        <div class="token-value">{{ (usage.candidatesTokenCount || 0).toLocaleString() }}</div>
      </div>
      <div class="token-box total">
        <div class="token-label">Total Tokens</div>
        <div class="token-value">{{ usage.totalTokenCount.toLocaleString() }}</div>
      </div>
    </div>

    <!-- Cached content tokens -->
    <div v-if="usage.cachedContentTokenCount" class="cached-section">
      <div class="section-title">Cached Content</div>
      <div class="cached-box">
        <span class="cached-label">Cached Tokens:</span>
        <span class="cached-value">{{ usage.cachedContentTokenCount.toLocaleString() }}</span>
      </div>
    </div>

    <!-- Prompt token details -->
    <div v-if="usage.promptTokensDetails && usage.promptTokensDetails.length > 0" class="details-section">
      <div class="section-title">Prompt Token Details</div>
      <div class="details-grid">
        <div
          v-for="(detail, idx) in usage.promptTokensDetails"
          :key="idx"
          class="detail-item"
        >
          <span class="detail-modality">{{ detail.modality }}</span>
          <span class="detail-count">{{ detail.tokenCount.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- Candidate token details -->
    <div v-if="usage.candidatesTokensDetails && usage.candidatesTokensDetails.length > 0" class="details-section">
      <div class="section-title">Candidate Token Details</div>
      <div class="details-grid">
        <div
          v-for="(detail, idx) in usage.candidatesTokensDetails"
          :key="idx"
          class="detail-item"
        >
          <span class="detail-modality">{{ detail.modality }}</span>
          <span class="detail-count">{{ detail.tokenCount.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- Cache token details -->
    <div v-if="usage.cacheTokensDetails && usage.cacheTokensDetails.length > 0" class="details-section">
      <div class="section-title">Cache Token Details</div>
      <div class="details-grid">
        <div
          v-for="(detail, idx) in usage.cacheTokensDetails"
          :key="idx"
          class="detail-item"
        >
          <span class="detail-modality">{{ detail.modality }}</span>
          <span class="detail-count">{{ detail.tokenCount.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- Thoughts token count -->
    <div v-if="usage.thoughtsTokenCount" class="details-section">
      <div class="section-title">Thinking Tokens</div>
      <div class="thoughts-box">
        <span class="thoughts-label">Thoughts Token Count:</span>
        <span class="thoughts-value">{{ usage.thoughtsTokenCount.toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-usage {
  padding: 16px;
}

.token-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.token-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.token-box.total {
  background: #eff6ff;
  border-color: #3b82f6;
}

.token-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.token-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.token-box.total .token-value {
  color: #1d4ed8;
}

/* Section styles */
.details-section,
.cached-section {
  margin-top: 20px;
  padding-top: 20px;
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

/* Details grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.detail-modality {
  font-weight: 500;
  color: #374151;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.detail-count {
  font-family: var(--llm-font-mono);
  font-weight: 600;
  color: #1e293b;
}

/* Cached section */
.cached-box,
.thoughts-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 6px;
}

.cached-label,
.thoughts-label {
  font-weight: 500;
  color: #166534;
}

.cached-value,
.thoughts-value {
  font-family: var(--llm-font-mono);
  font-weight: 700;
  color: #15803d;
  margin-left: auto;
}

/* Thoughts box specific */
.thoughts-box {
  background: #fef3c7;
  border-color: #fcd34d;
}

.thoughts-label {
  color: #92400e;
}

.thoughts-value {
  color: #b45309;
}
</style>
