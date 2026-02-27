<script setup lang="ts">
import { computed } from 'vue';
import { hashId } from '@/utils/id/hashId';
import type {
  OpenaiResponseRequest,
  OpenaiResponseInputItem,
  OpenaiResponseTool,
} from '@/types/openai-response/response-request';
import CollapsibleSection from '../../container/CollapsibleSection.vue';
import LabelValueRow from '../../content/LabelValueRow.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '../../content/SmartViewer.vue';
import OpenaiIcon from '@/assets/openai.svg';
import OpenaiResponseInputItemView from './OpenaiResponseInputItem.vue';
import OpenaiResponseToolItem from './OpenaiResponseToolItem.vue';

interface Props {
  data: OpenaiResponseRequest;
  path?: string;
}

const props = defineProps<Props>();

const inputItems = computed<OpenaiResponseInputItem[]>(() => {
  const input = props.data.input;

  // 统一为数组，后续渲染逻辑无需区分 string / object / array。
  if (typeof input === 'string') {
    return [
      {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: input }],
      },
    ];
  }

  if (Array.isArray(input)) {
    return input;
  }

  if (input && typeof input === 'object' && 'type' in input) {
    return [input as OpenaiResponseInputItem];
  }

  return [];
});

const tools = computed(() => props.data.tools || []);

const hasInstructions = computed(() => {
  return typeof props.data.instructions === 'string' && props.data.instructions.trim().length > 0;
});

const toolChoiceDisplay = computed(() => {
  const toolChoice = props.data.tool_choice;
  if (!toolChoice) return 'none';
  if (typeof toolChoice === 'string') return toolChoice;
  if (typeof toolChoice.name === 'string') return `${toolChoice.type}: ${toolChoice.name}`;
  return toolChoice.type;
});

const reasoningDisplay = computed(() => {
  const reasoning = props.data.reasoning;
  if (!reasoning) return 'none';
  const effort = reasoning.effort ? `effort=${reasoning.effort}` : null;
  const summary = reasoning.summary ? `summary=${reasoning.summary}` : null;
  return [effort, summary].filter(Boolean).join(', ') || 'configured';
});

const textDisplay = computed(() => {
  const textConfig = props.data.text;
  if (!textConfig) return 'none';
  if (textConfig.verbosity) return `verbosity=${textConfig.verbosity}`;
  return 'configured';
});

const includeDisplay = computed(() => {
  if (!props.data.include || props.data.include.length === 0) return null;
  return props.data.include.join(', ');
});

const getInputItemId = (item: OpenaiResponseInputItem, index: number): string => {
  const idCandidate = (item as Record<string, unknown>).id;
  if (typeof idCandidate === 'string' && idCandidate.length > 0) return idCandidate;

  const callIdCandidate = (item as Record<string, unknown>).call_id;
  if (typeof callIdCandidate === 'string' && callIdCandidate.length > 0) return callIdCandidate;

  return `openai-response-input-${index}-${hashId(JSON.stringify(item))}`;
};

const getToolId = (tool: OpenaiResponseTool, index: number): string => {
  if (typeof tool.type === 'string' && tool.type === 'function') {
    const toolName = (tool as Record<string, unknown>).name;
    if (typeof toolName === 'string' && toolName.length > 0) {
      return `openai-response-tool-${toolName}`;
    }
  }
  return `openai-response-tool-${index}-${hashId(JSON.stringify(tool))}`;
};

const highlightedKeys = new Set([
  'model',
  'instructions',
  'input',
  'tools',
  'tool_choice',
  'parallel_tool_calls',
  'reasoning',
  'text',
  'stream',
  'store',
  'include',
  'temperature',
  'top_p',
  'max_output_tokens',
  'max_tool_calls',
  'prompt_cache_key',
]);

const stringifyForTable = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const otherFieldRows = computed(() => {
  return Object.entries(props.data)
    .filter(([key, value]) => !highlightedKeys.has(key) && value !== undefined)
    .map(([key, value]) => ({
      key,
      value: stringifyForTable(value),
    }));
});
</script>

<template>
  <div class="openai-request-view">
    <div class="header">
      <h2><img :src="OpenaiIcon" class="header-icon" alt="OpenAI" /> OpenAI Responses API Request</h2>
      <div class="meta">
        <span>
          <span class="llm-label">model</span>
          <code>{{ data.model }}</code>
        </span>
        <span class="divider">·</span>
        <span>{{ inputItems.length }} input items</span>
        <span v-if="tools.length > 0" class="divider">·</span>
        <span v-if="tools.length > 0">{{ tools.length }} tools</span>
        <span class="divider">·</span>
        <span>stream: {{ data.stream ? 'true' : 'false' }}</span>
      </div>
    </div>

    <CollapsibleSection title="Parameters" :default-open="true" storage-key="openai-responses-parameters">
      <LabelValueRow label="Tool Choice" :value="toolChoiceDisplay" />
      <LabelValueRow label="Reasoning" :value="reasoningDisplay" />
      <LabelValueRow label="Text" :value="textDisplay" />
      <LabelValueRow label="Temperature" :value="data.temperature" />
      <LabelValueRow label="Top P" :value="data.top_p" />
      <LabelValueRow label="Max Output Tokens" :value="data.max_output_tokens" />
      <LabelValueRow label="Max Tool Calls" :value="data.max_tool_calls" />
      <LabelValueRow label="Parallel Tool Calls" :value="data.parallel_tool_calls !== undefined ? String(data.parallel_tool_calls) : null" />
      <LabelValueRow label="Store" :value="data.store !== undefined ? String(data.store) : null" />
      <LabelValueRow label="Include" :value="includeDisplay" />
      <LabelValueRow label="Prompt Cache Key" :value="data.prompt_cache_key" />
    </CollapsibleSection>

    <CollapsibleSection
      v-if="otherFieldRows.length > 0"
      title="Other Fields"
      :default-open="false"
      storage-key="openai-responses-other-fields"
    >
      <table class="other-fields-table">
        <thead>
          <tr>
            <th>field</th>
            <th>value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in otherFieldRows" :key="row.key">
            <th>{{ row.key }}</th>
            <td>
              <SmartViewer :text="row.value" />
            </td>
          </tr>
        </tbody>
      </table>
    </CollapsibleSection>

    <CollapsibleSection
      v-if="hasInstructions"
      title="Instructions"
      :default-open="true"
      storage-key="openai-responses-instructions"
      variant="system"
    >
      <SmartViewer :text="String(data.instructions)" />
    </CollapsibleSection>

    <CollapsibleSection
      title="Input"
      :count="inputItems.length"
      :default-open="true"
      storage-key="openai-responses-input"
      variant="default"
      enable-bulk-actions
    >
      <div v-if="inputItems.length === 0" class="empty-state">No input items</div>
      <OpenaiResponseInputItemView
        v-for="(item, index) in inputItems"
        :key="getInputItemId(item, index)"
        :id="getInputItemId(item, index)"
        :item="item"
        :index="index + 1"
      />
    </CollapsibleSection>

    <CollapsibleSection
      v-if="tools.length > 0"
      title="Tools"
      :count="tools.length"
      storage-key="openai-responses-tools"
      variant="tools"
      enable-bulk-actions
    >
      <OpenaiResponseToolItem
        v-for="(tool, index) in tools"
        :key="getToolId(tool, index)"
        :id="getToolId(tool, index)"
        :tool="tool"
        :index="index"
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

.other-fields-table {
  width: 100%;
  border-collapse: collapse;
}

.other-fields-table th,
.other-fields-table td {
  border: 1px solid #e2e8f0;
  padding: 8px;
  text-align: left;
  vertical-align: top;
}

.other-fields-table thead th {
  background: #f8fafc;
  font-size: 1.2rem;
  color: #334155;
}

.other-fields-table tbody th {
  width: 180px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #475569;
}
</style>
