<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '@/utils/format/formatDate';
import type { ClaudeRequest } from '@/types/claude/claude-request';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import MessageItem from '../messages/MessageItem.vue';
import ToolItem from '../tools/ToolItem.vue';

interface Props {
  data: ClaudeRequest;
}

const props = defineProps<Props>();

const messages = computed(() => {
  return props.data.messages || [];
});

const tools = computed(() => {
  return props.data.tools || [];
});

const toolChoice = computed(() => {
  const tc = props.data.tool_choice;
  if (!tc) return 'none';
  if (tc.type === 'any') return 'any';
  if (tc.type === 'tool') return `tool: ${tc.name}`;
  return tc.type;
});

const systemPrompt = computed(() => {
  const sys = props.data.system;
  if (!sys) return null;
  if (typeof sys === 'string') return sys;
  if (Array.isArray(sys)) {
    return sys.map(s => s.text).join('\n\n');
  }
  return null;
});

const thinkingConfig = computed(() => {
  const tc = props.data.thinking;
  if (!tc) return null;
  const parts = [tc.type];
  if (tc.budget_tokens) parts.push(`budget: ${tc.budget_tokens}`);
  return parts.join(', ');
});
</script>

<template>
  <div class="claude-request-view">
    <CollapsibleSection title="Basic Info" :default-open="true">
      <InfoItem label="Model" :value="data.model" />
      <InfoItem label="Max Tokens" :value="data.max_tokens" />
      <InfoItem label="Temperature" :value="data.temperature" />
      <InfoItem label="Top P" :value="data.top_p" />
      <InfoItem label="Top K" :value="data.top_k" />
      <InfoItem label="Stream" :value="data.stream ? 'Yes' : 'No'" />
      <InfoItem label="Tool Choice" :value="toolChoice" />
      <InfoItem label="Thinking Config" :value="thinkingConfig" />
      <InfoItem label="Stop Sequences" :value="data.stop_sequences?.join(', ')" />
      <InfoItem label="User ID" :value="data.metadata?.user_id" />
    </CollapsibleSection>

    <CollapsibleSection v-if="systemPrompt" title="System Prompt" :default-open="true">
      <pre class="system-content">{{ systemPrompt }}</pre>
    </CollapsibleSection>

    <CollapsibleSection title="Messages" :count="messages.length" :default-open="true" variant="default">
      <div v-if="messages.length === 0" class="empty-state">
        No messages
      </div>
      <MessageItem
        v-for="(message, index) in messages"
        :key="index"
        :role="message.role"
        :index="index"
        :message="message"
        apiStandard="claude"
      />
    </CollapsibleSection>

    <CollapsibleSection v-if="tools.length > 0" title="Tools" :count="tools.length" variant="tools">
      <ToolItem
        v-for="(tool, index) in tools"
        :key="index"
        :id="tool.name"
        :tool="tool"
        platform="claude"
      />
    </CollapsibleSection>

    <CollapsibleSection title="Full Request" :default-open="false">
      <JsonViewer :data="data" :collapsible="true" />
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.claude-request-view {
  padding: 2px;
}

.system-content {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #fef3c7;
  color: #1e293b;
  padding: 12px;
  border-radius: 6px;
  font-size: 1.4rem;
  white-space: pre-wrap;
  overflow-x: auto;
}

.empty-state {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 40px 20px;
}
</style>
