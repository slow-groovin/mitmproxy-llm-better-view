<script setup lang="ts">
import { computed } from 'vue';
import type { Part } from '@/types/gemini/request';
import SmartViewer from '@/components/content/SmartViewer.vue';
import ImageBlock from '@/components/content/ImageBlock.vue';
import ToolArgs from '@/components/llm/ToolArgs.vue';

interface Props {
  part: Part;
  index: number;
}

const props = defineProps<Props>();

// --- 1. 配置定义 (将类型与元数据解耦) ---
// 这里的 class 对应 CSS 中的 .badge-xxx
const PART_CONFIG: Record<string, { label: string; class: string }> = {
  text: { label: 'TEXT', class: 'text' },
  inlineData: { label: 'MEDIA', class: 'media' },
  fileData: { label: 'FILE', class: 'file' },
  functionCall: { label: 'TOOL', class: 'tool-use' }, // 对应 reference 的 badge-tool-use
  functionResponse: { label: 'RESP', class: 'response' },
  executableCode: { label: 'CODE', class: 'code' },
  codeExecutionResult: { label: 'RESULT', class: 'result' },
  unknown: { label: 'UNKNOWN', class: 'unknown' },
};

// --- 2. 核心逻辑：一次性计算当前类型 ---
const activeTypeKey = computed(() => {
  const keys = Object.keys(props.part);
  const foundKey = keys.find((k) => k in PART_CONFIG);
  return foundKey || 'unknown';
});

const activeConfig = computed(() => PART_CONFIG[activeTypeKey.value]);

// --- 3. 辅助数据处理 ---
const mediaUrl = computed(() => {
  if ('inlineData' in props.part) {
    return `data:${props.part.inlineData.mimeType};base64,${props.part.inlineData.data}`;
  }
  return '';
});

const toolInfo = computed(() => {
  if ('functionCall' in props.part) {
    return {
      name: props.part.functionCall.name,
      args: props.part.functionCall.args
    };
  }
  return null;
});

const prettyJson = (data: unknown) => JSON.stringify(data, null, 2);
</script>

<template>
  <div class="content-block" :class="`type-${activeConfig.class}`">
    
    <!-- Header: 样式严格参考 Reference -->
    <div class="block-header">
      <div class="header-left">
        <span class="block-type-badge" :class="`badge-${activeConfig.class}`">{{ activeConfig.label }}</span>
        <span class="block-index">#{{ index + 1 }}</span>
        
        <!-- Tool Name (Reference 风格) -->
        <span v-if="toolInfo?.name" class="block-name">{{ toolInfo.name }}</span>
        
        <!-- Function Response Name (复用 Reference 风格) -->
        <span v-if="activeTypeKey === 'functionResponse'" class="block-name name-response">
          {{ (part as any).functionResponse.name }}
        </span>
      </div>
    </div>

    <!-- Content Area -->
    <div class="block-content">
      
      <!-- TEXT -->
      <SmartViewer 
        v-if="activeTypeKey === 'text'" 
        :text="(part as any).text" 
      />

      <!-- MEDIA -->
      <template v-else-if="activeTypeKey === 'inlineData'">
        <div class="meta-label">{{ (part as any).inlineData.mimeType }}</div>
        <ImageBlock :url="mediaUrl" />
      </template>

      <!-- FILE -->
      <div v-else-if="activeTypeKey === 'fileData'" class="file-info">
        <span class="file-icon">📎</span>
        <span class="file-uri">{{ (part as any).fileData.fileUri }}</span>
        <span class="meta-label">({{ (part as any).fileData.mimeType }})</span>
      </div>

      <!-- TOOL CALL -->
      <ToolArgs 
        v-else-if="activeTypeKey === 'functionCall' && toolInfo" 
        :input="toolInfo.args" 
      />

      <!-- RESPONSE -->
      <template v-else-if="activeTypeKey === 'functionResponse'">
        <pre class="code-block bg-light">{{ prettyJson((part as any).functionResponse.response) }}</pre>
      </template>

      <!-- EXECUTABLE CODE -->
      <template v-else-if="activeTypeKey === 'executableCode'">
        <div class="sub-header text-blue">{{ (part as any).executableCode.language }}</div>
        <pre class="code-block bg-dark text-light">{{ (part as any).executableCode.code }}</pre>
      </template>

      <!-- EXECUTION RESULT -->
      <template v-else-if="activeTypeKey === 'codeExecutionResult'">
        <div class="result-header">
          <span 
            class="outcome-badge" 
            :class="(part as any).codeExecutionResult.outcome.toLowerCase()"
          >
            {{ (part as any).codeExecutionResult.outcome }}
          </span>
        </div>
        <pre class="code-block bg-light">{{ (part as any).codeExecutionResult.output }}</pre>
      </template>

      <!-- FALLBACK -->
      <div v-else class="unknown-block">
        <SmartViewer :text="prettyJson(part)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 
  核心样式复刻区 
  严格保持与 Reference 一致的边距、字体大小和布局逻辑
*/

.content-block {
  margin-bottom: 12px;
  margin-left: 8px;
  /* overflow: hidden; */
  /* 移除原有的白色背景和边框，保持 Reference 的清爽风格 */
}

.content-block:last-child {
  margin-bottom: 0;
}

/* Block Header - Compact style */
.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 移除原有的背景色和下边框，Reference 是没有的 */
  padding-bottom: 4px; 
}

.header-left {
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 8px; /* 增加一点间距，参考代码看似紧凑但有 flex */
}

.block-index {
  font-size: 1.3rem; /* Reference Size */
  color: #94a3b8;
  font-weight: 500;
}

.block-type-badge {
  font-size: 1rem; /* Reference Size (visual estimation approx 0.8-1rem based on look) */
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.block-name {
  font-family: var(--llm-font-mono, monospace);
  font-size: 1.4rem; /* Reference Size */
  font-weight: 600;
  color: var(--llm-badge-tool-use-text, #b45309);
  background: var(--llm-badge-tool-use-bg, #fffbeb);
  padding: 4px 10px;
  border-radius: 4px;
  flex-shrink: 0;
}

/* 特殊处理 Response 的名字颜色，使其与 Tool Call 区分开 */
.name-response {
  color: #0891b2;
  background: #cffafe;
}

/* Badge 颜色定义 - 优先使用 Reference 变量，Gemini 特有类型补全 */
.badge-text {
  background: var(--llm-badge-assistant-bg, #dbeafe);
  color: var(--llm-badge-assistant-text, #1e40af);
}

.badge-tool-use {
  background: var(--llm-badge-tool-bg, #e0e7ff);
  color: var(--llm-badge-tool-text, #3730a3);
}

.badge-media {
  background: #d1fae5;
  color: #065f46;
}

.badge-file {
  background: #fef3c7;
  color: #92400e;
}

.badge-response {
  background: #cffafe;
  color: #155e75;
}

.badge-code {
  background: #e2e8f0;
  color: #1e293b;
}

.badge-result {
  background: #dcfce7;
  color: #166534;
}

.badge-unknown {
  background: #f3f4f6;
  color: #4b5563;
}

/* Unknown 类型的左侧边框样式 (Reference 风格) */
.type-unknown {
  border-left: 3px solid #9ca3af;
  padding-left: 8px;
}

/* 
  内容区域样式适配 
*/
.block-content {
  /* 与 header 保持一点距离，如果没有 header 背景色的话 */
  padding-top: 4px;
}

/* 通用组件适配 */
.meta-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 4px;
  font-family: var(--llm-font-mono, monospace);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.file-uri {
  font-family: var(--llm-font-mono, monospace);
  font-size: 0.9rem;
  color: #334155;
}

.sub-header {
  font-family: var(--llm-font-mono, monospace);
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.text-blue { color: #3b82f6; }

.code-block {
  margin: 0;
  padding: 10px;
  border-radius: 6px; /* 更圆润一点，符合现代风格 */
  font-family: var(--llm-font-mono, monospace);
  font-size: 0.85rem;
  white-space: pre-wrap;
  overflow-x: auto;
}

.bg-light { background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; }
.bg-dark  { background: #1e293b; color: #e2e8f0; }

.unknown-block {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
}

.result-header { margin-bottom: 8px; }
.outcome-badge {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
}
.outcome-badge.ok, .outcome-badge.success { background: #dcfce7; color: #166534; }
.outcome-badge.error, .outcome-badge.dead { background: #fee2e2; color: #991b1b; }
</style>