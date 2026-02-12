<script setup lang="ts">
import type { Tool } from '../../../types/claude/claude-request';
import ToolItem from '../ToolItem.vue';

/**
 * Claude Tool Item 组件
 * 基于通用 ToolItem 的封装
 */

interface Props {
  tool: Tool;
  index: number;
}

const props = defineProps<Props>();
</script>

<template>
  <ToolItem
    :name="props.tool.name"
    :description="props.tool.description"
    :params="props.tool.input_schema"
    :index="props.index"
    standard="claude"
  />
</template>
