<template>
  <div class="text-block">
    <!-- 格式选择器头部 -->
    <div v-if="canToggle" class="text-block-header">
      <FormatSelector :current-format="displayFormat" @select="handleFormatChange" />

      <div class="header-actions">
        <button v-if="showViewRawBtn" class="view-raw-btn" @click="showRaw = !showRaw">
          {{ showRaw ? '▼' : '▶' }} View Raw
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div 
      class="content-wrapper" 
      @mouseenter="showButtons = true" 
      @mouseleave="showButtons = false"
    >
      <!-- 右上角浮动按钮 -->
      <div v-if="showFloatingButtons" class="floating-buttons" :class="{ visible: showButtons }">
        <WrapLineButton 
          v-if="showWrapLineBtn"
          :active="!wrapLines" 
          title="Toggle word wrap" 
          @click="wrapLines = !wrapLines" 
        />
        <CopyButton :content="text" success-message="Copied" />
      </div>

      <!-- 不同格式的渲染组件 -->
      <RawViewer 
        v-if="showRaw" 
        :content="text" 
        :wrap-lines="wrapLines" 
      />
      <ProseContent 
        v-else-if="displayFormat === 'markdown'" 
        v-model:content="textModel" 
        :wrap-lines="wrapLines" 
      />
      <XMLViewer 
        v-else-if="displayFormat === 'xml'" 
        v-model:content="textModel" 
        :wrap-lines="wrapLines" 
      />
      <JsonViewer 
        v-else-if="displayFormat === 'json'" 
        v-model:content="textModel" 
        :wrap-lines="wrapLines" 
      />
      <div 
        v-else 
        class="text-content" 
        :style="{ whiteSpace: wrapLines ? 'pre-wrap' : 'pre' }"
      >
        {{ text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ProseContent from '@/components/content/ProseContent.vue';
import XMLViewer from '@/components/content/XMLViewer.vue';
import JsonViewer from '@/components/content/JsonViewer.vue';
import RawViewer from '@/components/content/RawViewer.vue';
import FormatSelector from '@/components/common/FormatSelector.vue';
import CopyButton from '@/components/common/CopyButton.vue';
import WrapLineButton from '@/components/common/WrapLineButton.vue';
import { detectContentFormat, type ContentFormat } from '@/utils/format/formatContent';

interface Props {
  id?: string;
  text: string;
}

const props = defineProps<Props>();

// ========== 状态管理 ==========
const showRaw = ref(false);
const wrapLines = ref(true);
const manualFormat = ref<ContentFormat | null>(null);
const showButtons = ref(false);

// ========== 格式计算 ==========
const detectedFormat = computed(() => detectContentFormat(props.text));
const displayFormat = computed(() => manualFormat.value ?? detectedFormat.value);
const canToggle = computed(() => true);

// ========== 按钮显示逻辑 ==========
// markdown 不需要 WrapLineButton
const showWrapLineBtn = computed(() => displayFormat.value !== 'markdown');

// json 和 text 不需要 View Raw 按钮
const showViewRawBtn = computed(() => 
  !['json', 'text'].includes(displayFormat.value)
);

// 只有在需要显示任意按钮时才显示浮动容器
const showFloatingButtons = computed(() => !showRaw.value);

// ========== 双向绑定 ==========
const textModel = computed({
  get: () => props.text,
  set: () => { }
});

// ========== 事件处理 ==========
const handleFormatChange = (format: ContentFormat) => {
  manualFormat.value = format === detectedFormat.value ? null : format;
};
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
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: auto;
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
  transition: all 0.2s;
}

.view-raw-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
}

.content-wrapper {
  position: relative;
  border-radius: 6px;
  min-height: 32px;
}

.content-wrapper:hover {
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.6);
}

.floating-buttons {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
  pointer-events: none;
}

.floating-buttons.visible {
  opacity: 1;
  pointer-events: auto;
}

.text-content {
  font-size: 1.2rem;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 0;
}
</style>