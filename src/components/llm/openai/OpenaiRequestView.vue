<script setup lang="ts">
import { computed } from 'vue';
import type { OpenaiChatRequest } from '../../../types/openai/chat-request';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import OpenaiToolItem from './OpenaiToolItem.vue';
import OpenaiMessageItem from './OpenaiMessageItem.vue';

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
      <h2>OpenAI Chat Completions API Request</h2>
      <div class="meta">
        <code>{{ data.model }}</code>
        <span class="divider">·</span>
        <span>{{ messages.length }} messages</span>
        <span v-if="tools.length > 0" class="divider">·</span>
        <span v-if="tools.length > 0">{{ tools.length }} tools</span>
        <span class="divider">·</span>
        <span>stream: {{ data.stream ? 'true' : 'false' }}</span>
      </div>
    </div>

    <CollapsibleSection title="Parameters" :default-open="true" storage-key="parameters">
      <InfoItem label="Temperature" :value="data.temperature" />
      <InfoItem label="Top P" :value="data.top_p" />
      <InfoItem label="Max Tokens" :value="data.max_tokens" />
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
      />
    </CollapsibleSection>

    <CollapsibleSection v-if="tools.length > 0" title="Tools" storage-key="tools" :count="tools.length" variant="tools">
      <OpenaiToolItem
        v-for="(tool, index) in tools"
        :key="index"
        :tool="tool"
        :index="index"
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

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.meta code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
  font-family: 'SF Mono', Consolas, monospace;
  color: #374151;
}

.divider {
  color: #d1d5db;
}

.empty-state {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 40px 20px;
}
</style>