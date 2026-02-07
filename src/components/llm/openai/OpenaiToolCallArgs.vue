<script setup lang="ts">
import { computed } from 'vue';
import SmartViewer from '@/components/content/SmartViewer.vue';

interface Props {
  arguments: string | object;
}

const props = defineProps<Props>();

// Parse arguments to a flat object
const parsedArgs = computed<Record<string, string>>(() => {
  let obj: Record<string, unknown> = {};

  if (typeof props.arguments === 'string') {
    try {
      obj = JSON.parse(props.arguments);
    } catch {
      return { value: props.arguments };
    }
  } else if (props.arguments && typeof props.arguments === 'object') {
    obj = props.arguments as Record<string, unknown>;
  }

  // Flatten to 1 level: convert all values to strings
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
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
      <div v-for="(value, key) in parsedArgs" :key="key" class="param-item">
        
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
  background: rgba(248, 250, 252, 0.6);
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
