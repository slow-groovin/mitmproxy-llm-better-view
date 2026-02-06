<script setup lang="ts">
import { computed, ref } from 'vue';
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
const format = computed(() => detectContentFormat(props.text));
const canToggle = computed(() => format.value !== 'text' && props.isProse);
</script>

<template>
  <div class="text-block">
    <!-- 悬浮控制栏 -->
    <div v-if="canToggle" class="text-block-header">
      <!-- 左侧：弱化的格式标识 -->
      <span class="format-label">{{ format }}</span>
      
      <!-- 右侧：查看原文按钮 -->
      <button 
        class="view-raw-btn" 
        type="button"
        @click="showRaw = !showRaw"
      >
        {{ showRaw ? '▼' : '▶' }} View Raw
      </button>
    </div>
    
    <pre v-if="showRaw" class="text-block-raw">{{ text }}</pre>
    
    <div v-else class="text-block-content">
      <ProseContent :content="text" :format="format" />
    </div>
  </div>
</template>

<style scoped>
.text-block {
  margin: 0px 0;
  position: relative;
}

.text-block-header {
  display: flex;
  justify-content: space-between; /* 左右分布 */
  align-items: flex-start;        /* 顶部对齐 */
  margin-bottom: -2px;           /* 负边距，让 header 覆盖在内容上方 (高度约为一行字) */
  position: relative;
  pointer-events: none;           /* 容器本身不阻挡鼠标 */
  font-family: inherit;
}

/* 左侧格式标签 - 弱化样式 */
.format-label {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #49515d;         /* 浅灰色，不抢眼 */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: auto;   /* 允许选中文字 */
  
  /* 可选：如果左侧文字也会重叠，可以加一点点背景，或者保持完全透明显得更干净 */
  background: rgba(144, 126, 126, 0.4);
  backdrop-filter: blur(2px);
  padding: 0 4px;
  border-radius: 4px;
}

/* 右侧按钮 */
.view-raw-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  
  border: none;
  background: rgba(255, 255, 255, 0.6); /* 轻微背景防止文字重叠看不清 */
  backdrop-filter: blur(2px);
  padding: 2px 6px;
  border-radius: 4px;
  
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  pointer-events: auto;   /* 恢复点击事件 */
  transition: all 0.2s;
}

.view-raw-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.text-block-raw {
  font-family: Monaco, Menlo, monospace;
  background: #1e293b;
  color: #e2e8f0;
  /* 顶部 padding 加大，避免 Raw 模式下文字被悬浮按钮遮挡 */
  padding: 32px 12px 12px 12px; 
  border-radius: 6px;
  font-size: 2.0rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-x: auto;
  margin: 0;
}

.text-block-content {
  /* 视具体 ProseContent 样式而定，通常不需要额外 padding，
     因为 format 标签很小，且 view raw 在右侧，一般不会遮挡正文首行重要信息 */
}
</style>