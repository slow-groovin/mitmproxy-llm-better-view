<script setup lang="ts">
import { computed } from 'vue';
import SmartViewer from '@/components/content/SmartViewer.vue';

interface Props {
  /** 工具参数对象，适用于 Claude/Gemini 格式 */
  input?: Record<string, unknown>;
  /** 工具参数字符串或对象，适用于 OpenAI 格式 */
  arguments?: string | object;
}

const props = defineProps<Props>();

/**
 * 将输入统一转换为原始对象格式
 * 处理 OpenAI 的 arguments 字符串/对象 和 Claude/Gemini 的 input 对象
 */
const rawInput = computed<Record<string, unknown>>(() => {
  // 优先使用 arguments (OpenAI 格式)
  if (props.arguments !== undefined) {
    if (typeof props.arguments === 'string') {
      try {
        return JSON.parse(props.arguments) as Record<string, unknown>;
      } catch {
        return { value: props.arguments };
      }
    } else if (props.arguments && typeof props.arguments === 'object') {
      return props.arguments as Record<string, unknown>;
    }
    return {};
  }

  // 使用 input (Claude/Gemini 格式)
  if (props.input !== undefined) {
    return props.input;
  }

  return {};
});

/**
 * 将原始输入解析为扁平化的字符串对象，用于显示
 */
const parsedArgs = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(rawInput.value)) {
    if (value === null) {
      result[key] = 'null';
    } else if (value === undefined) {
      result[key] = 'undefined';
    } else if (typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value);
    }
  }

  return result;
});
</script>

<template>
  <div class="tool-args">
    <div class="param-list">
      <div
        v-for="(value, key) in parsedArgs"
        :key="key"
        class="param-item"
      >
        <div class="param-name">{{ key }}</div>
        <div class="param-value">
          <SmartViewer :text="value" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-args {
  font-family: 'Monaco', 'Menlo', monospace;
  border-radius: 4px;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.param-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 2px 4px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 6px;
}

.param-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2563eb;
  min-width: 80px;
  flex-shrink: 0;
  padding-top: 2px;
}

.param-value {
  flex: 1;
  font-size: 1.2rem;
  min-width: 0;
}

.param-value :deep(.text-block) {
  margin: 0;
}
</style>
