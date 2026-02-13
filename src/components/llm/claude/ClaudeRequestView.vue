<!-- ClaudeRequestView.vue -->
<script setup lang="ts">
import BetterDetails from '@/components/container/BetterDetails.vue';
import { computed, ref } from 'vue';
import type { ClaudeRequest } from '../../../types/claude/claude-request';
import CollapsibleSection from '../../container/CollapsibleSection.vue';
import LabelValueRow from '../../content/LabelValueRow.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import ToolItem from '../ToolItem.vue';
import ClaudeMessageItem from './ClaudeMessageItem.vue';
import ClaudeSystemMessage from './ClaudeSystemMessage.vue';
import ClaudeIcon from '@/assets/claude.svg';

interface Props {
  data: ClaudeRequest;
}

const props = defineProps<Props>();

// 移除旧的 provide/inject 方式，改用 CollapsibleSection 内置的 bulkCollapseState
// 子组件通过 inject('bulkCollapseState') 监听批量操作状态

const messages = computed(() => props.data.messages || []);
const tools = computed(() => props.data.tools || []);
const systemMessages = computed(() => {
  const sys = props.data.system;
  if (!sys) return [];
  if (typeof sys === 'string') return [{ type: 'text' as const, text: sys }];
  return sys;
});

const thinkingConfig = computed(() => {
  const thinking = props.data.thinking;
  if (!thinking) return 'disabled';
  if (thinking.type === 'disabled') return 'disabled';
  return `enabled (budget: ${thinking.budget_tokens || 'auto'} tokens)`;
});

const toolChoice = computed(() => {
  const tc = props.data.tool_choice;
  if (!tc) return 'auto';
  if (tc.type === 'auto') return 'auto';
  if (tc.type === 'any') return 'any';
  if (tc.type === 'tool') return `tool: ${tc.name}`;
  return 'auto';
});

const stopSequences = computed(() => {
  const stop = props.data.stop_sequences;
  if (!stop || stop.length === 0) return 'none';
  return stop.join(', ');
});

const hasSystemMessages = computed(() => {
  const sys = props.data.system;
  if (!sys) return false;
  if (typeof sys === 'string') return sys.length > 0;
  return sys.length > 0;
});
</script>

<template>
  <div class="claude-request-view">
    <div class="header">
      <h2>
        <img :src="ClaudeIcon" class="header-icon" alt="Claude" /> 
        Claude Messages API Request
      </h2>
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
        <span class="divider">·</span>
        <span>max_tokens: {{ data.max_tokens }}</span>
      </div>
    </div>

    <CollapsibleSection title="Parameters" :default-open="true" storage-key="claude-parameters">
      <LabelValueRow label="Temperature" :value="data.temperature" />
      <LabelValueRow label="Top P" :value="data.top_p" />
      <LabelValueRow label="Top K" :value="data.top_k" />
      <LabelValueRow label="Max Tokens" :value="data.max_tokens" />
      <LabelValueRow label="Thinking" :value="thinkingConfig" />
      <LabelValueRow label="Tool Choice" :value="toolChoice" />
      <LabelValueRow label="Stop Sequences" :value="stopSequences" />
    </CollapsibleSection>

    <CollapsibleSection 
      v-if="hasSystemMessages" 
      title="System Messages" 
      :count="systemMessages.length"
      :default-open="true" 
      storage-key="claude-system" 
      variant="system"
    >
      <ClaudeSystemMessage 
        v-for="(msg, index) in systemMessages" 
        :key="index" 
        :message="msg" 
        :index="index" 
      />
    </CollapsibleSection>

    <CollapsibleSection
      title="Messages"
      :count="messages.length"
      :default-open="true"
      storage-key="claude-messages"
      variant="default"
      :enable-bulk-actions="true"
    >
      <div v-if="messages.length === 0" class="empty-state">暂无消息</div>
      <ClaudeMessageItem
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
        :index="index + 1"
      />
    </CollapsibleSection>

    <CollapsibleSection
      v-if="tools.length > 0"
      title="Tools"
      :count="tools.length"
      storage-key="claude-tools"
      variant="tools"
      enable-bulk-actions
    >
      <ToolItem
        v-for="(tool, index) in tools"
        :key="index"
        :name="tool.name"
        :description="tool.description"
        :params="tool.input_schema"
        :index="index"
        standard="claude"
      />
    </CollapsibleSection>

    <BetterDetails title="Full Request">
      <SmartViewer :text="JSON.stringify(data, null, 2)" />
    </BetterDetails>
  </div>
</template>

<style scoped>
.claude-request-view {
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
}

.meta {
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>