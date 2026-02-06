<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  value?: string | number | null;
  formatter?: (value: string | number) => string;
  hideIfEmpty?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  formatter: undefined,
  hideIfEmpty: true
});

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return null;
  return props.formatter ? props.formatter(props.value) : String(props.value);
});

const shouldHide = computed(() => {
  return props.hideIfEmpty && (displayValue.value === null || displayValue.value === '');
});
</script>

<template>
  <div v-if="!shouldHide" class="info-item">
    <span class="info-label">{{ label }}</span>
    <span class="info-value">{{ displayValue }}</span>
  </div>
</template>

<style scoped>
.info-item {
  padding: 8px 4px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 1.2800000000000002rem;
  color: #64748b;
  font-weight: 500;
  min-width: 120px;
}

.info-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.2800000000000002rem;
}
</style>
