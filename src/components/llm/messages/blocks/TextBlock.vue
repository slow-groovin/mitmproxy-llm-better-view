

<template>
  <div class="text-block">
    <div v-if="canToggle" class="text-block-header">
      <span class="format-label">{{ format }}</span>
      <button 
        class="view-raw-btn" 
        @click="showRaw = !showRaw"
      >
        {{ showRaw ? '▼' : '▶' }} View Raw
      </button>
    </div>
    
    <!-- Raw 模式 -->
    <pre v-if="showRaw" class="raw-content">{{ text }}</pre>
    
    <!-- 格式分发 -->
    <template v-else>
      <!-- Markdown -->
      <ProseContent v-if="format === 'markdown'" :content="text" />
      
      <!-- XML -->
      <pre v-else-if="format === 'xml'" class="xml-content" v-html="highlightXml(text)" />
      
      <!-- 纯文本 -->
      <div v-else class="text-content">{{ text }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ProseContent from '../../../content/ProseContent.vue';
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
const format = computed(() => detectContentFormat(props.text));
const canToggle = computed(() => format.value !== 'text' && props.isProse);

// 简单的 XML 高亮(可选)
function highlightXml(xml: string): string {
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="xml-tag">$2</span>')
    .replace(/(&lt;[\w:-]+\s+)([\w:-]+)=/g, '$1<span class="xml-attr">$2</span>=')
    .replace(/=&quot;([^&]*)&quot;/g, '=<span class="xml-value">&quot;$1&quot;</span>');
}
</script>

<style scoped>
.text-block {
  margin: 0;
  position: relative;
}

.text-block-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: -2px;
  position: relative;
  pointer-events: none;
}

.format-label {
  font-size: 0.85rem;
  color: #64748b;
  font-family: ui-monospace, monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  padding: 0 4px;
  border-radius: 4px;
}

.view-raw-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s;
}

.view-raw-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
}

/* Raw 模式 */
.raw-content {
  font-family: ui-monospace, monospace;
  background: #1e293b;
  color: #e2e8f0;
  padding: 32px 12px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-x: auto;
  margin: 0;
}

/* 纯文本 */
.text-content {
  font-size: 1.2rem;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 0;
}

/* XML 高亮 */
.xml-content {
  font-family: ui-monospace, monospace;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  font-size: 1.5rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-x: auto;
  margin: 0;
}

.xml-content :deep(.xml-tag) {
  color: #0ea5e9;
  font-weight: 500;
}

.xml-content :deep(.xml-attr) {
  color: #8b5cf6;
}

.xml-content :deep(.xml-value) {
  color: #10b981;
}
</style>