<script setup lang="ts">
import { computed, ref } from 'vue';
import RoleBadge from './RoleBadge.vue';
import MessageContent from './MessageContent.vue';
import { ApiStandard } from '@/types/flow';
import { OpenaiChatMessage } from '@/types/openai/chat-request';
import { ClaudeMessage } from '@/types/claude/claude-request';
import { GeminiReqContent } from '@/types/gemini/request';


// OpenAI message types

// Claude message types
// interface ClaudeContentBlock {
//   type: string;
//   text?: string;
//   thinking?: string;
//   signature?: string;
//   id?: string;
//   name?: string;
//   input?: Record<string, unknown>;
//   tool_use_id?: string;
//   content?: string;
//   is_error?: boolean;
//   source?: {
//     type: string;
//     media_type: string;
//     data: string;
//   };
// }


// interface ClaudeMessage {
//   role: 'user' | 'assistant';
//   content: string | ClaudeContentBlock[];
// }

// Gemini message types
// interface GeminiPart {
//   text?: string;
//   inlineData?: { mimeType: string; data: string };
//   fileData?: { mimeType: string; fileUri: string };
//   functionCall?: { name: string; args: Record<string, unknown> };
//   functionResponse?: { name: string; response: Record<string, unknown> };
//   executableCode?: { language: string; code: string };
//   codeExecutionResult?: { outcome: string; output: string };
//   thought?: boolean;
//   thoughtSignature?: string;
// }

type GeminiMessage=GeminiReqContent
// interface GeminiMessage {
//   role: 'user' | 'model' | 'function';
//   parts: GeminiPart[];
// }

interface Props {
  id?: string;
  role: string;
  index: number;
  defaultOpen?: boolean;
  message: OpenaiChatMessage | ClaudeMessage | GeminiMessage;
  apiStandard: ApiStandard;
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: true
});

const isOpen = ref(props.defaultOpen);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

// Get role class for styling
const roleClass = computed(() => {
  const role = props.role.toLowerCase();
  if (role === 'model') return 'role-model';
  if (role === 'function') return 'role-function';
  return `role-${role}`;
});

// Handle tool call display (OpenAI)
const toolCalls = computed(() => {
  if (props.apiStandard !== 'openai') return [];
  const msg = props.message as OpenaiChatMessage;
  return msg.tool_calls || [];
});

// Handle tool result (OpenAI tool role)
const toolCallId = computed(() => {
  if (props.apiStandard !== 'openai') return null;
  const msg = props.message as OpenaiChatMessage;
  return msg.tool_call_id || null;
});

const toolName = computed(() => {
  if (props.apiStandard !== 'openai') return null;
  const msg = props.message as OpenaiChatMessage;
  return msg.name || null;
});
</script>

<template>
  <div class="message-item">
    <div class="message-header" @click="isOpen = !isOpen">
      <div class="message-header-left">
        <span class="toggle-icon">{{ toggleIcon }}</span>
        <span class="message-index">#{{ index + 1 }}</span>
        <RoleBadge :role="role" :platform="apiStandard" />
        <span v-if="toolName" class="tool-name-badge">{{ toolName }}</span>
      </div>
      <span v-if="id" class="message-id">{{ id.slice(0, 8) }}</span>
    </div>
    <div v-if="isOpen" class="message-content-wrapper">
      <div v-if="toolCallId" class="tool-call-info">
        <span class="tool-call-id-label">Tool Call ID:</span>
        <span class="tool-call-id-value">{{ toolCallId }}</span>
      </div>
      <MessageContent :content="message" :platform="apiStandard" />
      <div v-if="toolCalls.length > 0" class="tool-calls">
        <div v-for="(tool, idx) in toolCalls" :key="tool.id" class="tool-call-item">
          <div class="tool-call-name">
            <span class="tool-call-badge">tool_call</span>
            <span>{{ tool.function.name }}</span>
            <span class="tool-call-index">#{{ idx + 1 }}</span>
          </div>
          <div class="tool-call-args">
            <pre>{{ JSON.stringify(tool) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-item {
  border-bottom: 2px solid rgba(126, 180, 233, 0.31);
  padding: 4px 8px;
}

.message-item:last-child {
  border-bottom: none;
}

.message-header {
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-header:hover {
  background: #f8fafc;
  margin: 0 -12px;
  padding: 6px 12px;
  border-radius: 4px;
}

.message-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  transition: transform 0.2s;
  color: #64748b;
  font-size: 1.2000000000000002rem;
}

.message-index {
  font-size: 1.2000000000000002rem;
  color: #94a3b8;
  font-weight: 500;
}

.message-id {
  font-size: 1.2rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tool-name-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 1.2000000000000002rem;
  font-weight: 700;
  background: #f3e8ff;
  color: #7c3aed;
  font-family: 'Monaco', 'Menlo', monospace;
}

.message-content-wrapper {
  padding: 4px 16px;
  font-size: initial;
  background-color: rgba(136, 188, 197, 0.08);
  overflow-y: auto;
}

.tool-call-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  margin-bottom: 8px;
  font-size: 1.2000000000000002rem;
}

.tool-call-id-label {
  color: #64748b;
  font-weight: 500;
}

.tool-call-id-value {
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tool-calls {
  margin-top: 12px;
}

.tool-call-item {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

.tool-call-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
}

.tool-call-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #dbeafe;
  color: #1d4ed8;
}

.tool-call-index {
  color: #64748b;
  font-size: 1.2rem;
}

.tool-call-args {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 8px;
  border-radius: 4px;
  font-size: 1.2800000000000002rem;
  overflow-x: auto;
}

.tool-call-args pre {
  margin: 0;
}
</style>
