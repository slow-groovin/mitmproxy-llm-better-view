<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from  '../../../utils/format/formatDate';
import type { OpenaiChatResponse } from '../../../types/openai/chat-response';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import TokenUsage from '../shared/TokenUsage.vue';
import OpenaiChoice from './OpenaiChoice.vue';

interface Props {
  data: OpenaiChatResponse;
}

const props = defineProps<Props>();

const choices = computed(() => {
  return props.data.choices || [];
});

const finishReasonClass = (reason: string | null) => {
  if (!reason) return '';
  const r = reason.toLowerCase();
  if (r === 'stop') return 'finish-stop';
  if (r === 'length') return 'finish-length';
  if (r === 'tool_calls') return 'finish-tool-calls';
  if (r === 'content_filter') return 'finish-content-filter';
  return '';
};
</script>

<template>
  <div class="openai-response-view">
    <CollapsibleSection title="Basic Info" default-open>
      <InfoItem label="ID" :value="data.id" />
      <InfoItem label="Object" :value="data.object" />
      <InfoItem label="Model" :value="data.model" />
      <InfoItem label="Created" :value="formatDate(data.created)" />
      <InfoItem label="System Fingerprint" :value="data.system_fingerprint" />
    </CollapsibleSection>

    <CollapsibleSection v-if="data.usage" title="Token Usage" default-open>
      <TokenUsage :usage="data.usage" variant="default" />
    </CollapsibleSection>

    <CollapsibleSection title="Choices" :count="choices.length" default-open>
      <OpenaiChoice
        v-for="choice in choices"
        :key="choice.index"
        :choice="choice"
        :finish-reason-class="finishReasonClass"
      />
    </CollapsibleSection>

    <CollapsibleSection title="Full Response" :default-open="false">
      <JsonViewer :data="data" collapsible />
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.openai-response-view {
  padding: 2px;
}
</style>
