<script setup lang="ts">
import { computed } from 'vue';
import ToolParameter from './ToolParameter.vue';

interface Props {
  name: string;
  description?: string;
  parameters?: unknown;
}

const props = defineProps<Props>();

const schema = computed(() => {
  if (!props.parameters) return null;
  if (typeof props.parameters === 'object' && props.parameters !== null) {
    return props.parameters as Record<string, unknown>;
  }
  return null;
});

const schemaType = computed(() => {
  if (!schema.value) return null;
  return (schema.value as any).type || 'unknown';
});

const schemaProperties = computed(() => {
  if (!schema.value) return {};
  return (schema.value as any).properties || {};
});

const schemaRequired = computed(() => {
  if (!schema.value) return [];
  return (schema.value as any).required || [];
});

const propertyKeys = computed(() => {
  return Object.keys(schemaProperties.value);
});
</script>

<template>
  <div class="tool-definition">
    <div v-if="description" class="tool-description">
      {{ description }}
    </div>
    <div v-if="schema && propertyKeys.length > 0" class="tool-parameters">
      <div class="tool-parameters-title">Parameters ({{ schemaType }})</div>
      <ToolParameter
        v-for="propName in propertyKeys"
        :key="propName"
        :name="propName"
        :type="(schemaProperties[propName] as any).type"
        :description="(schemaProperties[propName] as any).description"
        :required="schemaRequired.includes(propName)"
        :enums="(schemaProperties[propName] as any).enum"
        :properties="(schemaProperties[propName] as any).properties"
      />
    </div>
    <pre v-else-if="schema" class="tool-schema-json">{{ JSON.stringify(schema, null, 2) }}</pre>
  </div>
</template>

<style scoped>
.tool-definition {
  margin: 6px 0;
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

.tool-schema-json {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow-x: auto;
}

.tool-schema-json pre {
  margin: 0;
}
</style>
