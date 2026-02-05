<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  enums?: unknown[];
  properties?: Record<string, unknown>;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'unknown',
  required: false
});

const hasNestedProperties = computed(() => {
  return props.properties && Object.keys(props.properties).length > 0;
});

const propertyKeys = computed(() => {
  if (!hasNestedProperties.value) return [];
  return Object.keys(props.properties!);
});

const typeBadgeClass = computed(() => {
  const t = props.type?.toLowerCase() || 'string';
  if (t === 'string' || t === 'str') return 'type-string';
  if (t === 'number' || t === 'int' || t === 'float') return 'type-number';
  if (t === 'boolean' || t === 'bool') return 'type-boolean';
  if (t === 'array' || t === 'list') return 'type-array';
  if (t === 'object') return 'type-object';
  return 'type-unknown';
});
</script>

<template>
  <div class="parameter-item">
    <div class="parameter-header">
      <span class="parameter-name">{{ name }}</span>
      <span v-if="type" class="parameter-type" :class="typeBadgeClass">{{ type }}</span>
      <span v-if="required" class="parameter-required">required</span>
    </div>
    <div v-if="description" class="parameter-description">
      {{ description }}
    </div>
    <div v-if="enums && enums.length > 0" class="parameter-enum">
      <span class="enum-label">Enum:</span>
      <span class="enum-values">{{ enums.join(', ') }}</span>
    </div>
    <div v-if="hasNestedProperties" class="parameter-properties">
      <div class="properties-title">Properties:</div>
      <div v-for="propName in propertyKeys" :key="propName" class="nested-parameter">
        <span class="nested-name">{{ propName }}:</span>
        <span class="nested-type">{{ (properties![propName] as any).type || 'unknown' }}</span>
        <span v-if="(properties![propName] as any).description" class="nested-desc">
          {{ (properties![propName] as any).description }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parameter-item {
  margin-bottom: 8px;
  padding: 6px 8px;
  background: #f8fafc;
  border-radius: 4px;
  border-left: 3px solid #3b82f6;
}

.parameter-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.parameter-name {
  font-weight: 600;
  font-size: 0.75rem;
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.parameter-type {
  font-size: 0.7rem;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: 6px;
}

.parameter-type.type-string {
  background: #dbeafe;
  color: #1d4ed8;
}

.parameter-type.type-number {
  background: #dcfce7;
  color: #166534;
}

.parameter-type.type-boolean {
  background: #fef3c7;
  color: #92400e;
}

.parameter-type.type-array {
  background: #e9d5ff;
  color: #6b21a8;
}

.parameter-type.type-object {
  background: #fce7f3;
  color: #9f1239;
}

.parameter-required {
  font-size: 0.65rem;
  color: #dc2626;
  background: #fef2f2;
  padding: 1px 4px;
;
  border-radius: 2px;
  margin-left: 4px;
  font-weight: 600;
}

.parameter-description {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.4;
}

.parameter-enum {
  margin-top: 4px;
  font-size: 0.7rem;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.enum-label {
  color: #64748b;
  font-weight: 500;
}

.enum-values {
  color: #374151;
  font-family: 'Monaco', 'Menlo', monospace;
}

.parameter-properties {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
}

.properties-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.nested-parameter {
  font-size: 0.7rem;
  padding: 2px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  color: #64748b;
}

.nested-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
}

.nested-type {
  color: #7c3aed;
}

.nested-desc {
  color: #94a3b8;
}
</style>
