<script setup lang="ts">
import { computed } from 'vue';
import type { GeminiRequest } from '../../../types/gemini/request';
import CollapsibleSection from '../../container/CollapsibleSection.vue';
import LabelValueRow from '../../content/LabelValueRow.vue';
import ToolItem from '../ToolItem.vue';
import GeminiMessageItem from './GeminiMessageItem.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import GeminiIcon from '@/assets/gemini.svg';

interface Props {
  data: GeminiRequest;
  path?: string;
}

const props = defineProps<Props>();

// 从 Flow 的 request path 中提取 modelName
// Gemini API path: /v1beta/models/gemini-3-flash-preview:generateContent
const modelName = computed(() => {
  if (!props.path) return undefined;
  const path = props.path;
  // 匹配 /models/{model-name}: 后的任意方法
  const match = path.match(/\/models\/([^/:?]+)/);
  return match ? match[1] : undefined;
});

const contents = computed(() => props.data.contents || []);
const tools = computed(() => props.data.tools || []);
const systemInstruction = computed(() => props.data.systemInstruction);

// generationConfig解析
const generationConfig = computed(() => props.data.generationConfig);

const toolConfig = computed(() => props.data.toolConfig);

// toolConfig显示 (作为Parameters中的一行)
const toolConfigDisplay = computed(() => {
  if (!toolConfig.value?.functionCallingConfig) return undefined;
  const mode = toolConfig.value.functionCallingConfig.mode;
  const allowed = toolConfig.value.functionCallingConfig.allowedFunctionNames;
  if (allowed && allowed.length > 0) {
    return `${mode} (${allowed.join(', ')})`;
  }
  return mode;
});

// 是否有系统指令
const hasSystemInstruction = computed(() => {
  return systemInstruction.value && systemInstruction.value.parts.length > 0;
});

// 获取系统指令文本
const systemInstructionText = computed(() => {
  if (!systemInstruction.value) return '';
  return systemInstruction.value.parts
    .filter(p => 'text' in p)
    .map(p => (p as { text: string }).text)
    .join('\n');
});
</script>

<template>
  <div class="gemini-request-view">
    <div class="header">
      <h2><img :src="GeminiIcon" class="header-icon" alt="Gemini" /> Gemini API Request</h2>
      <div class="meta">
        <span>
          <span class="llm-label">model</span>
          <code v-if="modelName">{{ modelName }}</code>
          

          <span v-else-if="data.cachedContent">{{ data.cachedContent }}</span>
          <span v-else>{{ contents.length }} contents</span>
        </span>

        <span v-if="tools.length > 0" class="divider">·</span>
        <span v-if="tools.length > 0">{{ tools.length }} tools</span>
        <span v-if="hasSystemInstruction" class="divider">·</span>
      </div>
    </div>

    <!-- Parameters Section -->
    <CollapsibleSection title="Parameters" :default-open="true" storage-key="gemini-parameters">
      <LabelValueRow label="Temperature" :value="generationConfig?.temperature" />
      <LabelValueRow label="Top P" :value="generationConfig?.topP" />
      <LabelValueRow label="Top K" :value="generationConfig?.topK" />
      <LabelValueRow label="Max Output Tokens" :value="generationConfig?.maxOutputTokens" />
      <LabelValueRow label="Candidate Count" :value="generationConfig?.candidateCount" />
      <LabelValueRow label="Response MimeType" :value="generationConfig?.responseMimeType" />
      <LabelValueRow label="Presence Penalty" :value="generationConfig?.presencePenalty" />
      <LabelValueRow label="Frequency Penalty" :value="generationConfig?.frequencyPenalty" />
      <LabelValueRow label="Tool Config" :value="toolConfigDisplay" />
    </CollapsibleSection>

    <!-- Safety Settings Section -->
    <CollapsibleSection v-if="data.safetySettings && data.safetySettings.length > 0" title="Safety Settings"
      :count="data.safetySettings.length" :default-open="false" storage-key="gemini-safety-settings">
      <div class="safety-settings-list">
        <div v-for="(setting, idx) in data.safetySettings" :key="idx" class="safety-setting-item">
          <span class="setting-category">{{ setting.category }}</span>
          <span class="setting-arrow">→</span>
          <span class="setting-threshold">{{ setting.threshold }}</span>
        </div>
      </div>
    </CollapsibleSection>

    <!-- System Instruction Section -->
    <CollapsibleSection v-if="hasSystemInstruction" title="System Instruction" :default-open="true"
      storage-key="gemini-system-instruction" variant="system">
      <SmartViewer :text="systemInstructionText" />
    </CollapsibleSection>

    <!-- Contents Section -->
    <CollapsibleSection title="Contents" :count="contents.length" :default-open="true" storage-key="gemini-contents"
      variant="default" enable-bulk-actions>
      <div v-if="contents.length === 0" class="empty-state">
        No contents
      </div>
      <GeminiMessageItem v-for="(content, index) in contents" :key="index" :content="content" :index="index + 1" />
    </CollapsibleSection>

    <!-- Tools Section -->
    <!-- Gemini 的 tools 是 [{ functionDeclarations: [...] }] 结构, 和 Claude 不同 -->
    <CollapsibleSection v-if="tools.length > 0" title="Tools"
      :count="tools.reduce((acc, t) => acc + (t.functionDeclarations?.length || 0), 0)" storage-key="gemini-tools"
      variant="tools">
      <template v-for="(tool, toolIdx) in tools" :key="toolIdx">
        <ToolItem
          v-for="(func, funcIdx) in tool.functionDeclarations"
          :key="`${toolIdx}-${funcIdx}`"
          :name="func.name"
          :description="func.description"
          :params="func.parameters"
          :index="tools.slice(0, toolIdx).reduce((acc, t) => acc + (t.functionDeclarations?.length || 0), 0) + funcIdx"
          standard="gemini"
        />
      </template>
    </CollapsibleSection>

    <BetterDetails title="Full Request">
      <SmartViewer :text="JSON.stringify(data, null, 2)" />
    </BetterDetails>
  </div>
</template>

<style scoped>
.gemini-request-view {
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

/* Safety settings styles */
.safety-settings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.safety-setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.95rem;
}

.setting-category {
  font-weight: 500;
  color: #374151;
}

.setting-arrow {
  color: #9ca3af;
}

.setting-threshold {
  color: #059669;
  font-weight: 500;
  background: #d1fae5;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
