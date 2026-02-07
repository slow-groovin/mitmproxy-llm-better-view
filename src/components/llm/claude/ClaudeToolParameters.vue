<script setup lang="ts">
import { computed } from 'vue';
import type { JSONSchema, JSONSchemaProperty } from '../../../types/claude/claude-request';

interface Props {
  schema?: JSONSchema;
}

const props = withDefaults(defineProps<Props>(), {
  schema: undefined
});

// Get parameter schema info
const schemaProperties = computed(() => props.schema?.properties || {});
const schemaRequired = computed(() => props.schema?.required || []);

// Get all property keys
const propertyKeys = computed(() => Object.keys(schemaProperties.value));

// Format type with additional info
function formatType(prop: JSONSchemaProperty): string {
  const type = prop.type || 'any';

  if (type === 'array' && prop.items) {
    const itemType = (prop.items as any)?.type || 'any';
    return `${itemType}[]`;
  }

  if (type === 'object' && prop.properties) {
    return 'object';
  }

  return type;
}

// Get default value display
function formatDefault(prop: JSONSchemaProperty): string | null {
  if (prop.default === undefined) return null;
  return JSON.stringify(prop.default);
}
</script>

<template>
  <div class="claude-tool-parameters">

    <!-- Properties List -->
    <div v-if="propertyKeys.length > 0" class="properties-list">
      <div
        v-for="propName in propertyKeys"
        :key="propName"
        class="property-item"
        :class="{ required: schemaRequired.includes(propName) }"
      >
        <!-- Property Header -->
        <div class="property-header">
          <span class="property-name">{{ propName }}</span>
          <span class="property-type">{{ formatType(schemaProperties[propName]) }}</span>
          <span v-if="schemaRequired.includes(propName)" class="required-badge">required</span>
          <span v-if="schemaProperties[propName].enum" class="enum-badge">
            enum[{{ schemaProperties[propName].enum?.length }}]
          </span>
        </div>

        <!-- Property Description -->
        <div v-if="schemaProperties[propName].description" class="property-description">
          {{ schemaProperties[propName].description }}
        </div>

        <!-- Enum Values -->
        <div v-if="schemaProperties[propName].enum" class="enum-values">
          <span class="enum-label">Allowed values:</span>
          <code
            v-for="val in schemaProperties[propName].enum"
            :key="String(val)"
            class="enum-value"
          >
            {{ JSON.stringify(val) }}
          </code>
        </div>

        <!-- Default Value -->
        <div v-if="formatDefault(schemaProperties[propName])" class="default-value">
          <span class="default-label">Default:</span>
          <code>{{ formatDefault(schemaProperties[propName]) }}</code>
        </div>

        <!-- Nested Object Properties -->
        <div
          v-if="schemaProperties[propName].properties"
          class="nested-properties"
        >
          <div class="nested-label">Object properties:</div>
          <div
            v-for="(nestedProp, nestedName) in schemaProperties[propName].properties"
            :key="nestedName"
            class="nested-property"
          >
            <span class="nested-name">{{ nestedName }}</span>
            <span class="nested-type">{{ (nestedProp as JSONSchemaProperty).type || 'any' }}</span>
            <span v-if="(nestedProp as JSONSchemaProperty).description" class="nested-desc">
              {{ (nestedProp as JSONSchemaProperty).description }}
            </span>
          </div>
        </div>

        <!-- Array Item Type -->
        <div
          v-if="schemaProperties[propName].items && typeof schemaProperties[propName].items === 'object'"
          class="array-items"
        >
          <div class="array-label">Array items:</div>
          <div class="array-item-type">
            <span class="item-type">{{ (schemaProperties[propName].items as JSONSchemaProperty).type || 'any' }}</span>
            <span
              v-if="(schemaProperties[propName].items as JSONSchemaProperty).description"
              class="item-desc"
            >
              {{ (schemaProperties[propName].items as JSONSchemaProperty).description }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- No Properties Message -->
    <div v-else class="no-properties">
      No parameters defined
    </div>
  </div>
</template>

<style scoped>
.claude-tool-parameters {
  font-size: 1.4rem;
}

.properties-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-item {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  border-left: 3px solid #cbd5e1;
}

.property-item.required {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.property-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.property-name {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 1.4rem;
  font-weight: 600;
  color: #1e293b;
}

.property-type {
  font-size: 1.2rem;
  color: #0ea5e9;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  background: #e0f2fe;
  padding: 1px 6px;
  border-radius: 3px;
}

.required-badge {
  font-size: 1rem;
  color: #f59e0b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.enum-badge {
  font-size: 1rem;
  color: #10b981;
  font-weight: 600;
  background: #d1fae5;
  padding: 1px 6px;
  border-radius: 3px;
}

.property-description {
  font-size: 1.3rem;
  color: #475569;
  margin-top: 6px;
  line-height: 1.5;
}

.enum-values {
  margin-top: 8px;
  padding: 8px;
  background: #ecfdf5;
  border-radius: 4px;
}

.enum-label {
  font-size: 1.1rem;
  color: #059669;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 8px;
}

.enum-value {
  display: inline-block;
  font-size: 1.2rem;
  color: #047857;
  background: #d1fae5;
  padding: 2px 6px;
  border-radius: 3px;
  margin: 2px 4px 2px 0;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.default-value {
  margin-top: 8px;
  font-size: 1.2rem;
  color: #64748b;
}

.default-label {
  font-weight: 600;
  margin-right: 4px;
}

.default-value code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  color: #475569;
}

.nested-properties {
  margin-top: 10px;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 4px;
  border-left: 2px solid #94a3b8;
}

.nested-label {
  font-size: 1.1rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.nested-property {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 1.2rem;
}

.nested-name {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 600;
  color: #334155;
}

.nested-type {
  font-size: 1.1rem;
  color: #0ea5e9;
  background: #e0f2fe;
  padding: 0 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.nested-desc {
  color: #64748b;
  font-style: italic;
}

.array-items {
  margin-top: 10px;
  padding: 10px;
  background: #eff6ff;
  border-radius: 4px;
  border-left: 2px solid #3b82f6;
}

.array-label {
  font-size: 1.1rem;
  color: #3b82f6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.array-item-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
}

.item-type {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 6px;
  border-radius: 3px;
}

.item-desc {
  color: #64748b;
  font-style: italic;
}

.no-properties {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  font-size: 1.3rem;
}
</style>
