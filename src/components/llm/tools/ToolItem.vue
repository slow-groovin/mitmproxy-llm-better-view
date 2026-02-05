<script setup lang="ts">
import { computed, ref } from 'vue';
import ToolDefinition from './ToolDefinition.vue';

type Platform = 'openai' | 'claude' | 'gemini';

// OpenAI tool
interface OpenaiTool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: unknown;
  };
}

// Claude tool
interface ClaudeTool {
  name: string;
  description: string;
  input_schema: unknown;
}

// Gemini tool
interface GeminiTool {
  functionDeclarations: Array<{
    name: string;
    description?: string;
    parameters?: unknown;
  }>;
}

interface Props {
  id?: string;
  tool: OpenaiTool | ClaudeTool | GeminiTool;
  platform: Platform;
}

const props = defineProps<Props>();

const isOpen = ref(false);

const toggleIcon = computed(() => isOpen.value ? '▼' : '▶');

// Parse tool based on platform
const toolName = computed(() => {
  if (props.platform === 'openai') {
    return (props.tool as OpenaiTool).function.name;
  }
  if (props.platform === 'claude') {
    return (props.tool as ClaudeTool).name;
  }
  if (props.platform === 'gemini') {
    const geminiTool = props.tool as GeminiTool;
    return geminiTool.functionDeclarations[0]?.name || 'unnamed';
  }
  return 'unknown';
});

const toolDescription = computed(() => {
  if (props.platform === 'openai') {
    return (props.tool as OpenaiTool).function.description;
  }
  if (props.platform === 'claude') {
    return (props.tool as ClaudeTool).description;
  }
  if (props.platform === 'gemini') {
    const geminiTool = props.tool as GeminiTool;
    return geminiTool.functionDeclarations[0]?.description;
  }
  return undefined;
});

const toolParameters = computed(() => {
  if (props.platform === 'openai') {
    return (props.tool as OpenaiTool).function.parameters;
  }
  if (props.platform === 'claude') {
    return (props.tool as ClaudeTool).input_schema;
  }
  if (props.platform === 'gemini') {
    const geminiTool = props.tool as GeminiTool;
    return geminiTool.functionDeclarations[0]?.parameters;
  }
  return undefined;
});
</script>

<template>
  <div class="tool-item">
    <div class="tool-header" @click="isOpen = !isOpen">
      <span class="tool-name-badge">{{ toolName }}</span>
      <span class="toggle-icon">{{ toggleIcon }}</span>
    </div>
    <div v-if="isOpen" class="tool-content">
      <div v-if="toolDescription" class="tool-description">
        {{ toolDescription }}
      </div>
      <div v-if="toolParameters" class="tool-parameters">
        <div class="tool-parameters-title">Parameters</div>
        <ToolDefinition
          :name="toolName"
          :description="toolDescription"
          :parameters="toolParameters"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-item {
  margin-bottom: 8px;
  padding: 6px 8px;
}

.tool-header {
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tool-header:hover {
  background: #f8fafc;
  margin: 0 -12px;
  padding: 6px 12px;
  border-radius: 4px;
}

.tool-name-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: initial;
  font-weight: 700;
  text-transform: none;
  background: #f3e8ff;
  color: #7c3aed;
  font-family: 'Monaco', 'Menlo', monospace;
}

.toggle-icon {
  transition: transform 0.2s;
  color: #64748b;
  font-size: 0.75rem;
}

.tool-content {
  padding: 4px 16px;
  font-size: initial;
  background-color: rgba(243, 232, 255, 0.1);
  overflow-y: auto;
}

.tool-description {
  margin: 6px 0;
  font-size: 1rem;
  color: #374151;
  line-height: 1.5;
}

.tool-parameters {
  margin-top: 8px;
}

.tool-parameters-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
  font-size: 0.875rem;
}
</style>
