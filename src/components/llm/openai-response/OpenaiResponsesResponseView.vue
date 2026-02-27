<script setup lang="ts">
import { computed } from 'vue';
import CollapsibleSection from '@/components/container/CollapsibleSection.vue';
import LabelValueRow from '@/components/content/LabelValueRow.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '@/components/content/SmartViewer.vue';
import OpenaiIcon from '@/assets/openai.svg';

interface Props {
  data: unknown;
}

const props = defineProps<Props>();

// 响应对象尚在迭代中，先做安全读取，避免模板层直接访问未知结构。
const rawObject = computed<Record<string, unknown> | null>(() => {
  if (!props.data || typeof props.data !== 'object' || Array.isArray(props.data)) {
    return null;
  }
  return props.data as Record<string, unknown>;
});

const responseId = computed(() => {
  return typeof rawObject.value?.id === 'string' ? rawObject.value.id : '';
});

const model = computed(() => {
  return typeof rawObject.value?.model === 'string' ? rawObject.value.model : '';
});

const outputCount = computed(() => {
  const output = rawObject.value?.output;
  return Array.isArray(output) ? output.length : 0;
});
</script>

<template>
  <div class="openai-responses-response-view">
    <div class="header">
      <h2><img :src="OpenaiIcon" class="header-icon" alt="OpenAI" /> OpenAI Responses API Response</h2>
      <p class="hint">
        Response/SSE 专用结构渲染正在建设中，当前先展示基础字段与完整原始 JSON。
      </p>
    </div>

    <CollapsibleSection title="Basic Info" :default-open="true" storage-key="openai-responses-response-basic">
      <LabelValueRow label="ID" :value="responseId || 'N/A'" />
      <LabelValueRow label="Model" :value="model || 'N/A'" />
      <LabelValueRow label="Output Items" :value="outputCount" />
    </CollapsibleSection>

    <BetterDetails title="Full Response">
      <SmartViewer :text="JSON.stringify(data, null, 2)" />
    </BetterDetails>
  </div>
</template>

<style scoped>
.openai-responses-response-view {
  padding: var(--llm-spacing-sm);
}

.header {
  margin-bottom: var(--llm-spacing-2xl);
  text-align: center;
}

.header h2 {
  margin: 0 0 var(--llm-spacing-sm) 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--llm-spacing-sm);
}

.header-icon {
  width: 28px;
  height: 28px;
  vertical-align: middle;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}
</style>
