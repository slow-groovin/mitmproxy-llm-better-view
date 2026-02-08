<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStorage } from '@vueuse/core';
import type { FunctionDeclaration } from '@/types/gemini/request';
import SmartViewer from '../../content/SmartViewer.vue';

interface Props {
  tool: FunctionDeclaration;
  index: number;
}

const props = defineProps<Props>();

const storageKey = computed(() => `gemini-tool-${props.tool.name}-open`);
const isOpen = useSessionStorage(storageKey, false);

const parameters = computed(() => props.tool.parameters);
const requiredParams = computed(() => parameters.value?.required || []);

const hasParameters = computed(() => {
  return parameters.value?.properties && Object.keys(parameters.value.properties).length > 0;
});

const paramEntries = computed(() => {
  if (!parameters.value?.properties) return [];
  return Object.entries(parameters.value.properties);
});

function isRequired(paramName: string): boolean {
  return requiredParams.value.includes(paramName);
}

function getParamType(param: Record<string, unknown>): string {
  if (param.type) return String(param.type);
  if (param.enum) return 'enum';
  return 'any';
}

function getParamConstraints(param: Record<string, unknown>): string[] {
  const constraints: string[] = [];

  if (param.enum && Array.isArray(param.enum)) {
    constraints.push(`enum: ${param.enum.join(', ')}`);
  }
  if (param.minimum !== undefined) {
    constraints.push(`min: ${param.minimum}`);
  }
  if (param.maximum !== undefined) {
    constraints.push(`max: ${param.maximum}`);
  }
  if (param.minLength !== undefined) {
    constraints.push(`minLen: ${param.minLength}`);
  }
  if (param.maxLength !== undefined) {
    constraints.push(`maxLen: ${param.maxLength}`);
  }
  if (param.pattern !== undefined) {
    constraints.push(`pattern: ${param.pattern}`);
  }

  return constraints;
}

function formatDefault(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
</script>

<template>
  <div class="tool-item" :class="{ 'is-open': isOpen }">
    <div class="tool-header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="toggle">{{ isOpen ? '▼' : '▶' }}</span>
        <span class="index">#{{ index + 1 }}</span>
        <span class="tool-name">{{ tool.name }}</span>
      </div>
      <div class="header-right" v-if="hasParameters">
        <span class="param-count">{{ paramEntries.length }} param(s)</span>
      </div>
    </div>

    <div v-show="isOpen" class="tool-content">
      <!-- Description -->
      <div v-if="tool.description" class="description">
        {{ tool.description }}
      </div>

      <!-- Parameters Section -->
      <div v-if="hasParameters" class="parameters-section">
        <div class="section-title">Parameters</div>

        <div class="params-list">
          <div
            v-for="[paramName, param] in paramEntries"
            :key="paramName"
            class="param-item"
            :class="{ 'is-required': isRequired(paramName) }"
          >
            <div class="param-header">
              <span class="param-name">{{ paramName }}</span>
              <span class="param-type">{{ getParamType(param) }}</span>
              <span v-if="isRequired(paramName)" class="required-badge">required</span>
            </div>

            <div v-if="param.description" class="param-description">
              {{ param.description }}
            </div>

            <div v-if="getParamConstraints(param).length > 0" class="param-constraints">
              <span
                v-for="constraint in getParamConstraints(param)"
                :key="constraint"
                class="constraint-tag"
              >
                {{ constraint }}
              </span>
            </div>

            <div v-if="param.default !== undefined" class="param-default">
              default: <code>{{ formatDefault(param.default) }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Raw Schema -->
      <div class="raw-schema">
        <div class="section-title">Raw Schema</div>
        <SmartViewer :text="JSON.stringify(tool, null, 2)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.tool-item:hover {
  border-color: #cbd5e1;
}

.tool-header {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  transition: background-color 0.2s;
}

.tool-header:hover {
  background: #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle {
  color: #64748b;
  font-size: 1rem;
}

.index {
  font-size: 1rem;
  color: #94a3b8;
}

.tool-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.1rem;
  font-family: var(--llm-font-mono);
}

.param-count {
  font-size: 0.9rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.tool-content {
  padding: 12px;
  border-top: 1px solid #e2e8f0;
}

.description {
  font-size: 1rem;
  color: #475569;
  margin-bottom: 12px;
  line-height: 1.5;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.parameters-section {
  margin-bottom: 16px;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
}

.param-item.is-required {
  border-left: 3px solid #f59e0b;
}

.param-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.param-name {
  font-weight: 600;
  color: #1e293b;
  font-family: var(--llm-font-mono);
}

.param-type {
  font-size: 0.85rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 1px 6px;
  border-radius: 3px;
}

.required-badge {
  font-size: 0.75rem;
  color: #92400e;
  background: #fef3c7;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.param-description {
  font-size: 0.95rem;
  color: #475569;
  margin-bottom: 6px;
  line-height: 1.4;
}

.param-constraints {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.constraint-tag {
  font-size: 0.8rem;
  color: #0369a1;
  background: #e0f2fe;
  padding: 2px 6px;
  border-radius: 3px;
}

.param-default {
  font-size: 0.9rem;
  color: #64748b;
}

.param-default code {
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: var(--llm-font-mono);
  font-size: 0.9em;
}

.raw-schema {
  margin-top: 12px;
}

.raw-schema :deep(.smart-viewer) {
  font-size: 0.9rem;
}
</style>
