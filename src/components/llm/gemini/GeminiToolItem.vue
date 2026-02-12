<script setup lang="ts">
import type { FunctionDeclaration } from '../../../types/gemini/request';
import ToolItem from '../ToolItem.vue';

/**
 * Gemini Tool Item 组件
 * 基于通用 ToolItem 的封装
 */

interface Props {
  tool: FunctionDeclaration;
  index: number;
}

const props = defineProps<Props>();
</script>

<template>
  <ToolItem
    :name="props.tool.name"
    :description="props.tool.description"
    :params="props.tool.parameters"
    :index="props.index"
    standard="gemini"
  />
</template>
