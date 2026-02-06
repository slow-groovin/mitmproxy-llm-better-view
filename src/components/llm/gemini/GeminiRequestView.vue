<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '@/utils/format/formatDate';
import type { GeminiRequest } from '../../../types/gemini/request';
import CollapsibleSection from '../shared/CollapsibleSection.vue';
import InfoItem from '../shared/InfoItem.vue';
import JsonViewer from '../shared/JsonViewer.vue';
import MessageItem from '../messages/MessageItem.vue';
import ToolItem from '../tools/ToolItem.vue';
import { logger } from '../../../lib/logtape';

interface Props {
  data: GeminiRequest;
}

const props = defineProps<Props>();
logger.debug`gemini request data: ${props.data}`

const contents = computed(() => {
  return props.data.contents || [];
});

const tools = computed(() => {
  return props.data.tools || [];
});

const functionDeclarations = computed(() => {
  const allDeclarations: any[] = [];
  for (const tool of tools.value) {
    if (tool.functionDeclarations) {
      allDeclarations.push(...tool.functionDeclarations);
    }
  }
  return allDeclarations;
});

const generationConfig = computed(() => {
  return props.data.generationConfig;
});

const toolConfig = computed(() => {
  const tc = props.data.toolConfig;
  if (!tc) return null;
  return `${tc.functionCallingConfig.mode}${
    tc.functionCallingConfig.allowedFunctionNames
      ? ` (${tc.functionCallingConfig.allowedFunctionNames.join(', ')})`
      : ''
  }`;
});

const systemInstruction = computed(() => {
  const sys = props.data.systemInstruction;
  if (!sys) return null;
  if (Array.isArray(sys.parts) && sys.parts.length > 0) {
    return sys.parts.map(p => {
      if (p.text) return p.text;
      if (p.inlineData) return '[inline data]';
      if (p.fileData) return `[file: ${p.fileData.fileUri}]`;
      return '[unknown part]';
    }).join('\n');
  }
  return null;
});

const thinkingConfig = computed(() => {
  const tc = props.data.generationConfig?.thinkingConfig;
  if (!tc) return null;
  const parts: string[] = [];
  if (tc.includeThoughts) parts.push('include_thoughts');
  if (tc.thinkingLevel) parts.push(`level: ${tc.thinkingLevel}`);
  return parts.length > 0 ? parts.join(', ') : null;
});
</script>

<template>
  <div class="gemini-request-view">
    <CollapsibleSection title="Basic Info" :default-open="true">
      <InfoItem v-if="generationConfig?.model" label="Model" :value="generationConfig.model" />
      <InfoItem label="Temperature" :value="generationConfig?.temperature" />
      <InfoItem label="Top P" :value="generationConfig?.topP" />
      <InfoItem label="Top K" :value="generationConfig?.topK" />
      <InfoItem label="Max Output Tokens" :value="generationConfig?.maxOutputTokens" />
      <InfoItem label="Candidate Count" :value="generationConfig?.candidateCount" />
      <InfoItem label="Response MIME Type" :value="generationConfig?.responseMimeType" />
      <InfoItem label="Tool Config" :value="toolConfig" />
      <InfoItem label="Thinking Config" :value="thinkingConfig" />
      <InfoItem label="Cached Content" :value="data.cachedContent" />
      <InfoItem label="Media Resolution" :value="data.mediaResolution" />
    </CollapsibleSection>

    <CollapsibleSection v-if="systemInstruction" title="System Instruction" :default-open="true">
      <pre class="system-content">{{ systemInstruction }}</pre>
    </CollapsibleSection>

    <CollapsibleSection title="Contents" :count="contents.length" :default-open="true" variant="default">
      <div v-if="contents.length === 0" class="empty-state">
        No contents
      </div>
      <MessageItem
        v-for="(content, index) in contents"
        :key="index"
        :role="content.role"
        :index="index"
        :message="content"
        platform="gemini"
      />
    </CollapsibleSection>

    <CollapsibleSection v-if="functionDeclarations.length > 0" title="Tools" :count="functionDeclarations.length" variant="tools">
      <div v-for="(func, index) in functionDeclarations" :key="index" class="function-declaration">
        <div class="function-header">
          <span class="function-badge">function</span>
          <span class="function-name">{{ func.name }}</span>
        </div>
        <div v-if="func.description" class="function-description">
          {{ func.description }}
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection v-if="data.safetySettings?.length > 0" title="Safety Settings" :count="data.safetySettings.length" :default-open="false">
      <div v-for="(setting, index) in data.safetySettings" :key="index" class="safety-setting">
        <span class="safety-category">{{ setting.category }}</span>
        <span class="safety-threshold">{{ setting.threshold }}</span>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Full Request" :defaultdefault-open="false">
      <JsonViewer :data="data" :collapsible="true" />
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.gemini-request-view {
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
  color: #64747b;
  font-style: italic;
  padding: 40px 20px;
}

.function-declaration {
  margin-bottom: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.function-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.function-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #f3e8ff;
  color: #7c3aed;
}

.function-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.4rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.function-description {
  font-size: 1.4rem;
  color: #64748b;
  line-height: 1.5;
}

.safety-setting {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 4px;
  margin-bottom: 6px;
}

.safety-category {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.2800000000000002rem;
}

.safety-threshold {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #64748b;
  font-size: 1.2800000000000002rem;
}
</style>
