<script setup lang="ts">
import type { ApiStandard } from '@/types/flow';
import { ref } from 'vue';
import icon from '@/assets/icon.png';
import ApiStandardSelect from './ApiStandardSelect.vue';

const emit = defineEmits<{
  'select-standard': [standard: ApiStandard];
}>();

// 未识别时默认只展示图标按钮，点击后再展开标准选择器。
const showSelector = ref(false);
const selectedStandard = ref<ApiStandard | ''>('');

const handleStandardChange = (standard: ApiStandard | '') => {
  selectedStandard.value = standard;
  // 只有用户真正选择了标准，才触发强制渲染。
  if (!standard) return;
  emit('select-standard', standard);
};
</script>

<template>
  <div class="unknown-standard-selector">
    <div class="selector-row">
      <button
        type="button"
        class="selector-trigger"
        :class="{ 'selector-trigger-open': showSelector }"
        aria-label="Manual standard selector"
        title="Manual force select standard"
        :aria-expanded="showSelector"
        @click="showSelector = !showSelector"
      >
        <img :src="icon" height="24px" class="trigger-icon" alt="LLM Better View" />
      </button>

      <div class="selector-panel" :class="{ 'selector-panel-open': showSelector }">
        <ApiStandardSelect
          v-if="showSelector"
          :model-value="selectedStandard"
          :allow-empty="true"
          empty-label="----Select----"
          @update:model-value="handleStandardChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.unknown-standard-selector {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin: 0;
}

.selector-row {
  display: flex;
  align-items: center;
}

.selector-trigger {
  /* app icon 是 3:1，按钮改为横向尺寸以避免图片溢出覆盖下拉框。 */
  width: 80px;
  height: 30px;
  border: 0px solid #cfd8e3;
  border-radius: 999px;
  background: #f8fafc;
  cursor: pointer;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.selector-trigger:hover {
  background: #eff6ff;
}

.selector-trigger-open {
  /* 展开时图标按钮轻微左移，给右侧下拉留出视觉空间。 */
  transform: translateX(-6px);
}

.trigger-icon {
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
}

.selector-panel {
  max-width: 0;
  margin-left: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-width 0.2s ease, opacity 0.2s ease, margin-left 0.2s ease;
}

.selector-panel-open {
  max-width: 170px;
  margin-left: 6px;
  opacity: 1;
}
</style>
