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
const PART_CONFIG: Record<string, { label: string; class: string }> = {
  text: { label: 'TEXT', class: 'text' },
  inlineData: { label: 'MEDIA', class: 'media' },
  fileData: { label: 'FILE', class: 'file' },
  functionCall: { label: 'TOOL', class: 'tool' },
  functionResponse: { label: 'RESPONSE', class: 'response' },
  executableCode: { label: 'CODE', class: 'code' },
  codeExecutionResult: { label: 'RESULT', class: 'result' },
  unknown: { label: 'UNKNOWN', class: 'unknown' },
};

// --- 2. 核心逻辑：一次性计算当前类型 ---
const activeTypeKey = computed(() => {
  const keys = Object.keys(props.part);
  // 找到 Part 中存在的已知 key (text, inlineData, etc.)
  const foundKey = keys.find((k) => k in PART_CONFIG);
  return foundKey || 'unknown';
});

// 获取当前类型的配置信息
const activeConfig = computed(() => PART_CONFIG[activeTypeKey.value]);

// --- 3. 辅助数据处理 ---
// 针对特定类型的快捷访问器 (Helpers)
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

// 格式化 JSON 用于展示 (避免在 template 中直接调用 JSON.stringify)
const prettyJson = (data: unknown) => JSON.stringify(data, null, 2);
</script>

<template>
  <!-- 动态绑定类名：type-text, type-tool 等 -->
  <div class="content-part" :class="`type-${activeConfig.class}`">
    
    <!-- Header -->
    <div class="part-header">
      <div class="header-left">
        <span class="part-type-badge">{{ activeConfig.label }}</span>
        <span class="part-index">#{{ index + 1 }}</span>
        <span v-if="toolInfo?.name" class="part-name">{{ toolInfo.name }}</span>
      </div>
    </div>

    <!-- Content: 使用 v-if 匹配 activeTypeKey，更加直观 -->
    <div class="part-content">
      
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
        <div class="sub-header text-cyan">{{ (part as any).functionResponse.name }}</div>
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
      <pre v-else class="code-block bg-gray">{{ prettyJson(part) }}</pre>
    </div>
  </div>
</template>

<style scoped>
/* 定义 CSS 变量：将颜色逻辑与结构分离，便于维护 */
.content-part {
  --bg-header: #f8fafc;
  --border-color: #e2e8f0;
  
  /* 默认颜色 (Unknown) */
  --badge-bg: #f1f5f9;
  --badge-text: #64748b;

  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

/* 类型特定的颜色覆盖 */
.type-text     { --badge-bg: #dbeafe; --badge-text: #1e40af; }
.type-media    { --badge-bg: #d1fae5; --badge-text: #065f46; }
.type-file     { --badge-bg: #fef3c7; --badge-text: #92400e; }
.type-tool     { --badge-bg: var(--llm-badge-tool-bg, #e0e7ff); --badge-text: var(--llm-badge-tool-text, #3730a3); }
.type-response { --badge-bg: #cffafe; --badge-text: #155e75; }
.type-code     { --badge-bg: #e2e8f0; --badge-text: #1e293b; }
.type-result   { --badge-bg: #dcfce7; --badge-text: #166534; }

/* 布局与通用样式 */
.part-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.part-type-badge {
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  background: var(--badge-bg);
  color: var(--badge-text);
}

.part-index {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
}

.part-name {
  font-family: var(--llm-font-mono, monospace);
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.part-content {
  padding: 12px;
}

/* 通用组件样式 */
.meta-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 4px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
}

.file-uri {
  font-family: monospace;
  font-size: 0.9rem;
  color: #334155;
}

.sub-header {
  font-family: monospace;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.text-cyan { color: #0891b2; }
.text-blue { color: #3b82f6; }

.code-block {
  margin: 0;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  overflow-x: auto;
}

.bg-light { background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; }
.bg-dark  { background: #1e293b; color: #e2e8f0; }
.bg-gray  { background: #f1f5f9; color: #475569; }

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