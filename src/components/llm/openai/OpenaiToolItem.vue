<script setup lang="ts">
import type { OpenaiTool } from '../../../types/openai/chat-request';
import ToolItem from '../ToolItem.vue';

/**
 * OpenAI Tool Item 组件
 * 基于通用 ToolItem 的封装
 */

interface Props {
  tool: OpenaiTool;
  index: number;
}

const props = defineProps<Props>();
</script>

<template>
  <ToolItem
    :name="props.tool.function.name"
    :description="props.tool.function.description"
    :params="props.tool.function.parameters"
    :index="props.index"
    standard="openai"
  />
</template>
