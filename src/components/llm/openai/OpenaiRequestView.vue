<script setup lang="ts">
import { computed } from 'vue';
import type { OpenaiChatRequest } from '../../../types/openai/chat-request';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import MessageItem from '../messages/MessageItem.vue';
import ToolItem from '../tools/ToolItem.vue';
import OpenaiMessageItem from './OpenaiMessageItem.vue';

interface Props {
  data: OpenaiChatRequest;
}

const props = defineProps<Props>();

// Extract messages for display
const messages = computed(() => {
  return props.data.messages || [];
});

// Extract tools for display
const tools = computed(() => {
  return props.data.tools || [];
});

// Extract tool choice
const toolChoice = computed(() => {
  const tc = props.data.tool_choice;
  if (!tc) return 'none';
  if (typeof tc === 'string') return tc;
  if (tc.type === 'function') return `function: ${tc.function.name}`;
  return 'unknown';
});

// Extract response format
const responseFormat = computed(() => {
  const rf = props.data.response_format;
  if (!rf) return 'none';
  if (typeof rf === 'string') return rf;
  if (rf.type === 'json_schema') return `json_schema: ${rf.json_schema.name}`;
  return rf.type;
});

// Format stream value
const streamValue = computed(() => {
  return props.data.stream ? 'Yes' : 'No';
});

// Format stop value
const stopValue = computed(() => {
  if (Array.isArray(props.data.stop)) {
    return props.data.stop.join(', ');
  }
  return props.data.stop;
});
</script>

<template>
  <div class="openai-request-view">
    <CollapsibleSection title="Basic Info" :default-open="true" storage-key="basic-info">
      <InfoItem label="Model" :value="data.model" />
      <InfoItem label="Temperature" :value="data.temperature" />
      <InfoItem label="Top P" :value="data.top_p" />
      <InfoItem label="Max Tokens" :value="data.max_tokens" />
      <InfoItem label="Stream" :value="streamValue" />
      <InfoItem label="Tool Choice" :value="toolChoice" />
      <InfoItem label="Response Format" :value="responseFormat" />
      <InfoItem label="Seed" :value="data.seed" />
      <InfoItem label="Stop" :value="stopValue" />
      <InfoItem label="Frequency Penalty" :value="data.frequency_penalty" />
      <InfoItem label="Presence Penalty" :value="data.presence_penalty" />
    </CollapsibleSection>

    <CollapsibleSection title="Messages" :count="messages.length" :default-open="true" variant="default">
      <div v-if="messages.length === 0" class="empty-state">
        No messages
      </div>
      <OpenaiMessageItem
        v-for="(message, index) in messages"
        :key="index"
        :role="message.role"
        :index="index"
        :message="message"
        apiStandard="openai"
      />
    </CollapsibleSection>

    <CollapsibleSection v-if="tools.length > 0" title="Tools" storage-key="tools" :count="tools.length" variant="tools">
      <ToolItem
        v-for="(tool, index) in tools"
        :key="index"
        :id="`tool-${index}`"
        :tool="tool"
        platform="openai"
      />
    </CollapsibleSection>

    <CollapsibleSection title="Full Request" storage-key="full-content" :default-open="false">
      <JsonViewer :data="data" :collapsible="true" />
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.openai-request-view {
  padding: 2px;
}

.empty-state {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 40px 20px;
}
</style>
