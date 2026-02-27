<script setup lang="ts">
import { computed } from 'vue';
import { hashId } from '@/utils/id/hashId';
import type {
  OpenaiResponse,
  OpenaiResponseSSEWrapper,
  OpenaiResponseOutputItem,
  
} from '@/types/openai-response/response-response';
import type {OpenaiResponseTool} from '@/types/openai-response/response-request'
import {
  isOpenaiResponse,
  isOpenaiResponseSSEWrapper,
} from '@/types/openai-response/response-response';
import CollapsibleSection from '@/components/container/CollapsibleSection.vue';
import LabelValueRow from '@/components/content/LabelValueRow.vue';
import BetterDetails from '@/components/container/BetterDetails.vue';
import SmartViewer from '@/components/content/SmartViewer.vue';
import OpenaiTokenUsage from '@/components/llm/openai/OpenaiTokenUsage.vue';
import OpenaiIcon from '@/assets/openai.svg';
import OpenaiResponseInputItemView from './OpenaiResponseInputItem.vue';
import OpenaiResponseToolItem from './OpenaiResponseToolItem.vue';

interface Props {
  data: OpenaiResponse | OpenaiResponseSSEWrapper | unknown;
}

const props = defineProps<Props>();

// Normalize payload so response/sse both render via a single response object.
const response = computed<OpenaiResponse | null>(() => {
  if (isOpenaiResponseSSEWrapper(props.data)) return props.data.response;
  if (isOpenaiResponse(props.data)) return props.data;
  return null;
});

// Extract SSE meta when the wrapper shape is provided.
const sseMeta = computed(() => {
  return isOpenaiResponseSSEWrapper(props.data) ? props.data.meta ?? null : null;
});

const responseId = computed(() => response.value?.id ?? '');
const model = computed(() => response.value?.model ?? '');
const status = computed(() => response.value?.status ?? 'unknown');
const outputItems = computed<OpenaiResponseOutputItem[]>(() => {
  return Array.isArray(response.value?.output) ? response.value?.output ?? [] : [];
});
// Responses SSE sometimes echoes request-level instructions/tools; hide them to avoid duplication.
const ignoreRequestEcho = computed(() => true);
const tools = computed<OpenaiResponseTool[]>(() => {
  if (ignoreRequestEcho.value) return [];
  return Array.isArray(response.value?.tools) ? response.value?.tools ?? [] : [];
});
const totalTokens = computed(() => response.value?.usage?.total_tokens ?? 0);
const sseEventCount = computed(() => {
  return typeof sseMeta.value?.event_count === 'number' ? sseMeta.value.event_count : null;
});

const hasInstructions = computed(() => {
  if (ignoreRequestEcho.value) return false;
  return typeof response.value?.instructions === 'string' && response.value.instructions.trim().length > 0;
});

// Render-friendly summaries for config fields.
const toolChoiceDisplay = computed(() => {
  const toolChoice = response.value?.tool_choice;
  if (!toolChoice) return 'none';
  if (typeof toolChoice === 'string') return toolChoice;
  if (typeof toolChoice.name === 'string') return `${toolChoice.type}: ${toolChoice.name}`;
  return toolChoice.type;
});

const reasoningDisplay = computed(() => {
  const reasoning = response.value?.reasoning;
  if (!reasoning) return 'none';
  const effort = reasoning.effort ? `effort=${reasoning.effort}` : null;
  const summary = reasoning.summary ? `summary=${reasoning.summary}` : null;
  return [effort, summary].filter(Boolean).join(', ') || 'configured';
});

const textDisplay = computed(() => {
  const textConfig = response.value?.text;
  if (!textConfig) return 'none';
  if (textConfig.verbosity) return `verbosity=${textConfig.verbosity}`;
  return 'configured';
});

const includeDisplay = computed(() => {
  if (!response.value?.include || response.value.include.length === 0) return null;
  return response.value.include.join(', ');
});

const hasError = computed(() => {
  return response.value?.error !== null && response.value?.error !== undefined;
});

// Generic stringifier for table cells.
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

// Keep the "Other Fields" section focused on non-highlighted keys.
const highlightedKeys = new Set([
  'id',
  'object',
  'created_at',
  'status',
  'background',
  'completed_at',
  'error',
  'model',
  'instructions',
  'output',
  'tools',
  'tool_choice',
  'parallel_tool_calls',
  'reasoning',
  'text',
  'usage',
  'temperature',
  'top_p',
  'frequency_penalty',
  'presence_penalty',
  'max_output_tokens',
  'max_tool_calls',
  'prompt_cache_key',
  'prompt_cache_retention',
  'previous_response_id',
  'service_tier',
  'store',
  'truncation',
  'user',
  'include',
  'safety_identifier',
]);

const otherFieldRows = computed(() => {
  if (!response.value) return [];
  return Object.entries(response.value)
    .filter(([key, value]) => !highlightedKeys.has(key) && value !== undefined)
    .map(([key, value]) => ({
      key,
      value: stringifyForTable(value),
    }));
});

// Stable IDs keep collapse state consistent across renders.
const getOutputItemId = (item: OpenaiResponseOutputItem, index: number): string => {
  const idCandidate = (item as Record<string, unknown>).id;
  if (typeof idCandidate === 'string' && idCandidate.length > 0) return idCandidate;

  const callIdCandidate = (item as Record<string, unknown>).call_id;
  if (typeof callIdCandidate === 'string' && callIdCandidate.length > 0) return callIdCandidate;

  return `openai-response-output-${index}-${hashId(JSON.stringify(item))}`;
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

// Always provide a safe JSON fallback for the raw viewer.
const rawJson = computed(() => {
  try {
    return JSON.stringify(props.data ?? {}, null, 2);
  } catch {
    return String(props.data ?? '');
  }
});
</script>

<template>
  <div class="openai-responses-response-view">
    <div class="header">
      <h2><img :src="OpenaiIcon" class="header-icon" alt="OpenAI" /> OpenAI Responses API Response</h2>
      <div class="meta">
        <span>
          <span class="llm-label">model</span>
          <code>{{ model || 'N/A' }}</code>
        </span>
        <span class="divider">·</span>
        <span>{{ outputItems.length }} output items</span>
        <span class="divider">·</span>
        <span>status: <span class="status-pill">{{ status }}</span></span>
        <span v-if="totalTokens > 0" class="divider">·</span>
        <span v-if="totalTokens > 0">{{ totalTokens.toLocaleString() }} tokens</span>
        <span v-if="sseEventCount !== null" class="divider">·</span>
        <span v-if="sseEventCount !== null">SSE events: {{ sseEventCount }}</span>
      </div>
    </div>

    <div v-if="!response" class="empty-state">
      Invalid Responses API payload
    </div>

    <template v-else>
      <CollapsibleSection title="Basic Info" :default-open="true" storage-key="openai-responses-response-basic">
        <LabelValueRow label="ID" :value="responseId" />
        <LabelValueRow label="Object" :value="response.object" />
        <LabelValueRow label="Status" :value="response.status" />
        <LabelValueRow label="Model" :value="response.model" />
        <LabelValueRow label="Created At" :value="response.created_at" />
        <LabelValueRow label="Completed At" :value="response.completed_at" />
        <LabelValueRow label="Background" :value="response.background !== undefined ? String(response.background) : null" />
        <LabelValueRow label="Service Tier" :value="response.service_tier" />
        <LabelValueRow label="Previous Response ID" :value="response.previous_response_id" />
        <LabelValueRow label="Prompt Cache Key" :value="response.prompt_cache_key" />
        <LabelValueRow label="Safety Identifier" :value="response.safety_identifier" />
      </CollapsibleSection>

      <CollapsibleSection title="Parameters" :default-open="true" storage-key="openai-responses-response-parameters">
        <LabelValueRow label="Tool Choice" :value="toolChoiceDisplay" />
        <LabelValueRow label="Reasoning" :value="reasoningDisplay" />
        <LabelValueRow label="Text" :value="textDisplay" />
        <LabelValueRow label="Temperature" :value="response.temperature" />
        <LabelValueRow label="Top P" :value="response.top_p" />
        <LabelValueRow label="Frequency Penalty" :value="response.frequency_penalty" />
        <LabelValueRow label="Presence Penalty" :value="response.presence_penalty" />
        <LabelValueRow label="Max Output Tokens" :value="response.max_output_tokens" />
        <LabelValueRow label="Max Tool Calls" :value="response.max_tool_calls" />
        <LabelValueRow
          label="Parallel Tool Calls"
          :value="response.parallel_tool_calls !== undefined ? String(response.parallel_tool_calls) : null"
        />
        <LabelValueRow label="Store" :value="response.store !== undefined ? String(response.store) : null" />
        <LabelValueRow label="Truncation" :value="response.truncation" />
        <LabelValueRow label="Include" :value="includeDisplay" />
      </CollapsibleSection>

      <CollapsibleSection
        v-if="hasError"
        title="Error"
        :default-open="true"
        storage-key="openai-responses-response-error"
        variant="error"
      >
        <SmartViewer :text="stringifyForTable(response.error)" />
      </CollapsibleSection>

      <CollapsibleSection
        v-if="response.usage"
        title="Token Usage"
        :default-open="true"
        storage-key="openai-responses-response-usage"
      >
        <OpenaiTokenUsage :usage="response.usage" />
      </CollapsibleSection>

      <CollapsibleSection
        v-if="hasInstructions"
        title="Instructions"
        :default-open="false"
        storage-key="openai-responses-response-instructions"
        variant="system"
      >
        <SmartViewer :text="String(response.instructions)" />
      </CollapsibleSection>

      <CollapsibleSection
        title="Output"
        :count="outputItems.length"
        :default-open="true"
        storage-key="openai-responses-response-output"
        variant="default"
        enable-bulk-actions
      >
        <div v-if="outputItems.length === 0" class="empty-state">No output items</div>
        <OpenaiResponseInputItemView
          v-for="(item, index) in outputItems"
          :key="getOutputItemId(item, index)"
          :id="getOutputItemId(item, index)"
          :item="item"
          :index="index + 1"
          storage-prefix="openai-response-output"
          storage-sub-prefix="openai-response-output-sub"
        />
      </CollapsibleSection>

      <CollapsibleSection
        v-if="tools.length > 0"
        title="Tools"
        :count="tools.length"
        storage-key="openai-responses-response-tools"
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

      <CollapsibleSection
        v-if="otherFieldRows.length > 0"
        title="Other Fields"
        :default-open="false"
        storage-key="openai-responses-response-other-fields"
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
        v-if="sseMeta"
        title="SSE Meta"
        :default-open="false"
        storage-key="openai-responses-response-meta"
      >
        <LabelValueRow label="Event Count" :value="sseMeta.event_count" />
        <LabelValueRow label="Parse Errors" :value="sseMeta.parse_error_count" />
        <LabelValueRow
          v-if="sseMeta.unknown_event_types?.length"
          label="Unknown Event Types"
          :value="sseMeta.unknown_event_types.join(', ')"
        />
      </CollapsibleSection>

      <BetterDetails title="Full Response">
        <SmartViewer :text="rawJson" />
      </BetterDetails>
    </template>
  </div>
</template>

<style scoped>
.openai-responses-response-view {
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

.status-pill {
  padding: 2px 8px;
  border-radius: var(--llm-radius-md);
  font-size: 12px;
  font-weight: 600;
  background: #e2e8f0;
  color: #334155;
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
