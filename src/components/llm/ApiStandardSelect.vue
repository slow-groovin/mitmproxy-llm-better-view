<script setup lang="ts">
import type { ApiStandard } from '@/types/flow';

interface Props {
  modelValue: ApiStandard | '';
  allowEmpty?: boolean;
  emptyLabel?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: ApiStandard | ''];
}>();

// 统一四种标准的下拉选项，供多个场景复用。
const standardOptions: { value: ApiStandard; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'openai-response', label: 'OpenAI Response' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
];

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value as ApiStandard | '';
  emit('update:modelValue', value);
};
</script>

<template>
  <select :value="props.modelValue" @change="handleChange" class="standard-select">
    <option v-if="props.allowEmpty" value="">{{ props.emptyLabel || '----Select----' }}</option>
    <option v-for="opt in standardOptions" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>

<style scoped>
.standard-select {
  /* 维持已有低干扰样式，避免打断主内容阅读。 */
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.8);
  color: #666;
  cursor: pointer;
  outline: none;
  opacity: 0.6;
  transition: opacity 0.2s, border-color 0.2s;
}

.standard-select:hover {
  opacity: 1;
  border-color: #ccc;
}

.standard-select:focus {
  opacity: 1;
  border-color: #999;
}
</style>
