<script setup lang="ts">
import { computed } from 'vue';
import type { OpenaiResponseTool, OpenaiResponseFunctionTool } from '@/types/openai-response/response-request';
import ToolItem from '../ToolItem.vue';

interface Props {
  id: string;
  tool: OpenaiResponseTool;
  index: number;
}

const props = defineProps<Props>();

const isFunctionTool = computed(() => {
  return props.tool.type === 'function' && typeof (props.tool as OpenaiResponseFunctionTool).name === 'string';
});

const toolName = computed(() => {
  if (isFunctionTool.value) {
    return (props.tool as OpenaiResponseFunctionTool).name;
  }
  return props.tool.type || 'tool';
});

const toolDescription = computed(() => {
  if (isFunctionTool.value) {
    return (props.tool as OpenaiResponseFunctionTool).description;
  }
  return undefined;
});

const toolParams = computed(() => {
  // 非 function 工具直接展示完整对象，避免字段丢失。
  if (isFunctionTool.value) {
    return (props.tool as OpenaiResponseFunctionTool).parameters;
  }
  return props.tool;
});
</script>

<template>
  <ToolItem
    :id="id"
    :name="toolName"
    :description="toolDescription"
    :params="toolParams"
    :index="index"
    standard="openai"
  />
</template>
