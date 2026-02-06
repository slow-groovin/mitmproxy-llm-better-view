<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ProseContent from '../../shared/ProseContent.vue';
import { detectContentFormat } from '../../../../utils/format/formatContent';

interface Props {
  id?: string;
  text: string;
  isProse?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isProse: false
});

const showRaw = ref(false);
const format = ref<'text' | 'json' | 'xml' | 'markdown'>('text');

onMounted(() => {
  format.value = detectContentFormat(props.text);
});

const canToggle = computed(() => format.value !== 'text' && props.isProse);
const displayContent = ref(props.text);

function toggleRaw() {
  showRaw.value = !showRaw.value;
}
</script>

<template>
  <div class="text-block">
    <div v-if="canToggle" class="text-block-header" @click="toggleRaw">
      <span class="text-block-badge" :class="format">{{ format }}</span>
      <span class="text-block-toggle">{{ showRaw ? '▼' : '▶' }} View Raw</span>
    </div>
    <div v-if="showRaw" class="text-block-raw">
      <pre>{{ text }}</pre>
    </div>
    <ProseContent v-else :content="text" :format="format" />
  </div>
</template>

<style scoped>
.text-block {
  margin: 4px 0;
}

.text-block-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  margin-bottom: 4px;
}

.text-block-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #e5e7eb;
  color: #374151;
}

.text-block-badge.json {
  background: #dbeafe;
  color: #1d4ed8;
}

.text-block-badge.xml {
  background: #fef3c7;
  color: #92400e;
}

.text-block-badge.markdown {
  background: #dcfce7;
  color: #166534;
}

.text-block-toggle {
  font-size: 1.2000000000000002rem;
  color: #64748b;
}

.text-block-raw {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  font-size: 1.4rem;
  white-space: pre-wrap;
  overflow-x: auto;
}

.text-block-raw pre {
  margin: 0;
}
</style>
