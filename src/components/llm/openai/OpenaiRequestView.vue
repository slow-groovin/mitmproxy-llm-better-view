<script setup lang="ts">
import { computed } from 'vue';
import type { OpenaiChatRequest } from '../../../types/openai/chat-request';
import CollapsibleSection from '../../container/CollapsibleSection.vue';
import LabelValueRow from '../../content/LabelValueRow.vue';
import ToolItem from '../ToolItem.vue';
import OpenaiMessageItem from './OpenaiMessageItem.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import OpenaiIcon from '@/assets/openai.svg';

interface Props {
  data: OpenaiChatRequest;
}

const props = defineProps<Props>();

const messages = computed(() => props.data.messages || []);
const tools = computed(() => props.data.tools || []);

const toolChoice = computed(() => {
  const tc = props.data.tool_choice;
  if (!tc) return 'none';
  if (typeof tc === 'string') return tc;
  if (tc.type === 'function') return `function: ${tc.function.name}`;
  return 'unknown';
});

const responseFormat = computed(() => {
  const rf = props.data.response_format;
  if (!rf) return 'none';
  if (typeof rf === 'string') return rf;
  if (rf.type === 'json_schema') return `json_schema: ${rf.json_schema.name}`;
  return rf.type;
});

const stopValue = computed(() => {
  if (Array.isArray(props.data.stop)) {
    return props.data.stop.join(', ');
  }
  return props.data.stop;
});
</script>

<template>
  <div class="openai-request-view">
    <div class="header">
      <h2><img :src="OpenaiIcon" class="header-icon" alt="OpenAI" /> OpenAI Chat Completions API Request</h2>
      <div class="meta">
        <span>
          <span class="llm-label">model</span>
          <code>{{ data.model }}</code>
        </span>
        <span class="divider">·</span>
        <span>{{ messages.length }} messages</span>
        <span v-if="tools.length > 0" class="divider">·</span>
        <span v-if="tools.length > 0">{{ tools.length }} tools</span>
        <span class="divider">·</span>
        <span>stream: {{ data.stream ? 'true' : 'false' }}</span>
      </div>
    </div>

    <CollapsibleSection title="Parameters" :default-open="true" storage-key="parameters">
      <LabelValueRow label="Temperature" :value="data.temperature" />
      <LabelValueRow label="Top P" :value="data.top_p" />
      <LabelValueRow label="Max Tokens" :value="data.max_tokens" />
      <LabelValueRow label="Tool Choice" :value="toolChoice" />
      <LabelValueRow label="Response Format" :value="responseFormat" />
      <LabelValueRow label="Seed" :value="data.seed" />
      <LabelValueRow label="Stop" :value="stopValue" />
      <LabelValueRow label="Frequency Penalty" :value="data.frequency_penalty" />
      <LabelValueRow label="Presence Penalty" :value="data.presence_penalty" />
    </CollapsibleSection>

    <CollapsibleSection title="Messages" :count="messages.length" :default-open="true" storage-key="messages"
      variant="default">
      <div v-if="messages.length === 0" class="empty-state">
        No messages
      </div>
      <OpenaiMessageItem v-for="(message, index) in messages" :key="index" :role="message.role" :index="index + 1"
        :message="message" />
    </CollapsibleSection>

    <CollapsibleSection v-if="tools.length > 0" title="Tools" storage-key="tools" :count="tools.length" variant="tools">
      <ToolItem
        v-for="(tool, index) in tools"
        :key="index"
        :name="tool.function.name"
        :description="tool.function.description"
        :params="tool.function.parameters"
        :index="index"
        standard="openai"
      />
    </CollapsibleSection>

    <BetterDetails title="Full Request">
      <SmartViewer :text="JSON.stringify(data, null, 2)" />
    </BetterDetails>
  </div>
</template>

<style scoped>
.openai-request-view {
  padding: var(--llm-spacing-sm);
}

.header {
  margin-bottom: var(--llm-spacing-2xl);
  text-align: center;
}

.header h2 {
  margin: 0 0 var(--llm-spacing-md) 0;
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--llm-spacing-sm);
}

.header-icon {
  width: 32px;
  height: 32px;
  vertical-align: middle;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--llm-spacing-md);
  font-size: 14px;
  color: #6b7280;
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
</style>
