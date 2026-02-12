<script setup lang="ts">
import { computed, ref } from 'vue';

// 定义组件名称以便递归调用
defineOptions({
  name: 'ToolParameters',
});

/**
 * ---------------- Types ----------------
 */

interface JSONSchemaProperty {
  type?: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  items?: JSONSchemaProperty; // Array items definition
  properties?: Record<string, JSONSchemaProperty>; // Object properties
  required?: string[];
  [key: string]: unknown;
}

interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  description?: string;
  $schema?: string;
  [key: string]: unknown;
}

interface Props {
  /** JSON Schema 对象 */
  schema?: JSONSchema | Record<string, unknown> | {};
  /** 当前嵌套层级 (用于样式缩进) */
  depth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  schema: () => ({}),
  depth: 0, // 默认层级为 0
});

/**
 * ---------------- Logic ----------------
 */

// 安全获取 schema 对象
const schemaObj = computed(() => props.schema as JSONSchema);

// 获取当前层级的属性列表
const schemaProperties = computed(() => {
  return schemaObj.value.properties || {};
});

// 获取 required 字段列表
const schemaRequired = computed(() => {
  return schemaObj.value.required || [];
});

// 属性名列表
const propertyKeys = computed(() => Object.keys(schemaProperties.value));

// 状态管理：记录展开的属性 (key: propName)
// 默认全部展开，如果想默认折叠，初始化为空对象即可
const expandedKeys = ref<Record<string, boolean>>({});

// 切换展开状态
const toggleExpand = (key: string) => {
  // 如果未定义，初始化为 true (因为我们默认是展开的，点击则是收起)
  if (expandedKeys.value[key] === undefined) {
    expandedKeys.value[key] = false;
  } else {
    expandedKeys.value[key] = !expandedKeys.value[key];
  }
};

// 判断属性是否展开
const isExpanded = (key: string) => {
  return expandedKeys.value[key] !== false; // 默认为 true
};

/**
 * ---------------- Helpers ----------------
 */

// 格式化类型显示
function formatType(prop: JSONSchemaProperty): string {
  const type = prop.type || 'any';
  if (type === 'array' && prop.items) {
    const itemType = prop.items.type || 'any';
    return itemType === 'object' ? 'Array<Object>' : `${itemType}[]`;
  }
  return type;
}

// 格式化默认值
function formatDefault(prop: JSONSchemaProperty): string | null {
  if (prop.default === undefined) return null;
  // 如果是对象或数组，格式化一下
  if (typeof prop.default === 'object') {
    return JSON.stringify(prop.default);
  }
  return String(prop.default);
}

// 判断是否有子属性需要渲染 (Object 或 Array of Objects)
function getNestedSchema(prop: JSONSchemaProperty): JSONSchema | null {
  // Case 1: 类型是 Object 且有 properties
  if (prop.type === 'object' && prop.properties) {
    return {
      properties: prop.properties,
      required: prop.required,
      type: 'object',
    };
  }
  
  // Case 2: 类型是 Array 且 items 是 Object 且有 properties
  if (prop.type === 'array' && prop.items && prop.items.type === 'object' && prop.items.properties) {
    return {
      properties: prop.items.properties,
      required: prop.items.required,
      type: 'object', // 渲染时当作 object 结构展示
    };
  }

  return null;
}
</script>

<template>
  <div class="tool-parameters" :style="{ '--depth': depth }">
    <!-- 有属性时渲染列表 -->
    <div v-if="propertyKeys.length > 0" class="properties-list">
      <div
        v-for="propName in propertyKeys"
        :key="propName"
        class="property-row"
        :class="{ 
          'is-required': schemaRequired.includes(propName),
          'has-nested': !!getNestedSchema(schemaProperties[propName])
        }"
      >
        <!-- Property Main Info -->
        <div class="property-content">
          <div class="property-header">
            <!-- 展开/折叠 按钮 (仅针对嵌套对象) -->
            <button
              v-if="getNestedSchema(schemaProperties[propName])"
              class="expand-btn"
              @click="toggleExpand(propName)"
              :class="{ 'is-closed': !isExpanded(propName) }"
              title="Toggle details"
            >
              <span class="icon-caret">▼</span>
            </button>
            <span v-else class="expand-placeholder"></span>

            <!-- 参数名 -->
            <span class="property-name">{{ propName }}</span>
            
            <!-- 参数类型 -->
            <span class="property-type">{{ formatType(schemaProperties[propName]) }}</span>
            
            <!-- Required 标记 -->
            <span v-if="schemaRequired.includes(propName)" class="badge required-badge">REQUIRED</span>
            
            <!-- Enum 标记 -->
            <span v-if="schemaProperties[propName].enum" class="badge enum-badge">
              ENUM
            </span>
          </div>

          <!-- 描述 -->
          <div v-if="schemaProperties[propName].description" class="property-desc">
            {{ schemaProperties[propName].description }}
          </div>

          <!-- Enum Values 详情 -->
          <div v-if="schemaProperties[propName].enum" class="meta-block">
            <span class="meta-label">Options:</span>
            <div class="enum-container">
              <code v-for="val in schemaProperties[propName].enum" :key="String(val)" class="code-pill">
                {{ JSON.stringify(val) }}
              </code>
            </div>
          </div>

          <!-- Default Value -->
          <div v-if="formatDefault(schemaProperties[propName])" class="meta-block">
            <span class="meta-label">Default:</span>
            <code class="code-pill default-pill">{{ formatDefault(schemaProperties[propName]) }}</code>
          </div>
        </div>

        <!-- 递归渲染嵌套属性 (Secondary Params) -->
        <div 
          v-if="getNestedSchema(schemaProperties[propName])" 
          v-show="isExpanded(propName)"
          class="nested-container"
        >
          <div class="nested-label">
            {{ schemaProperties[propName].type === 'array' ? 'Item Properties:' : 'Properties:' }}
          </div>
          <!-- 递归调用自身，depth + 1 -->
          <ToolParameters 
            :schema="getNestedSchema(schemaProperties[propName])!" 
            :depth="depth + 1"
          />
        </div>
      </div>
    </div>

    <!-- 无属性时显示 (仅在顶层显示) -->
    <div v-else-if="depth === 0" class="no-properties">
      No parameters defined
    </div>
  </div>
</template>

<style scoped>
/* 基础变量 */
.tool-parameters {
  --color-border: #e2e8f0;
  --color-bg-subtle: #f8fafc;
  --color-bg-hover: #f1f5f9;
  --color-text-main: #1e293b;
  --color-text-sub: #64748b;
  --color-primary: #0ea5e9;
  --color-nonrequired: #c6c6c682;
  --color-warning: #f59e0b;
  --color-success: #10b981;
  --font-mono: 'Monaco', 'Menlo', 'Consolas', monospace;
  
  font-size: 14px;
  width: 100%;
}

.properties-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 单个属性行 */
.property-row {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: white;
  transition: all 0.2s ease;
  overflow: hidden;
}

/* Required 样式高亮 */
.property-row.is-required {
  border-left: 3px solid var(--color-warning);
}
.property-row:not(.is-required) {
  border-left: 3px solid var(--color-nonrequired);
}

/* 内容区域 padding */
.property-content {
  padding: 10px 12px;
}

/* 头部布局 */
.property-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 展开按钮 */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-sub);
  transition: transform 0.2s;
}
.expand-btn:hover {
  color: var(--color-primary);
}
.expand-btn.is-closed .icon-caret {
  transform: rotate(-90deg);
}
.icon-caret {
  font-size: 10px;
  transition: transform 0.2s;
}
.expand-placeholder {
  width: 16px;
}

/* 属性名 */
.property-name {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 14px;
}

/* 属性类型 */
.property-type {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-primary);
  background: #e0f2fe;
  padding: 1px 6px;
  border-radius: 4px;
}

/* Badges */
.badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.05em;
}
.required-badge {
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fcd34d;
}
.enum-badge {
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
}

/* 描述 */
.property-desc {
  margin-top: 4px;
  color: var(--color-text-sub);
  font-size: 13px;
  line-height: 1.5;
  padding-left: 24px; /* 对齐 icon 之后的文本 */
}

/* Meta Block (Enum/Default) */
.meta-block {
  margin-top: 8px;
  padding-left: 24px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.meta-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-sub);
  text-transform: uppercase;
}
.enum-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Code Pills */
.code-pill {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-main);
}
.default-pill {
  background: #f1f5f9;
  color: #475569;
}

/* 嵌套容器样式 */
.nested-container {
  background: #f8fafc; /* 略微深一点的背景 */
  border-top: 1px solid var(--color-border);
  padding: 8px 12px 12px 36px; /* 增加左侧 padding 实现缩进 */
}

.nested-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-sub);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 递归组件样式调整：如果是在内部，减少边框干扰 */
.nested-container :deep(.property-row) {
  background: white;
  border-color: #e2e8f0;
}

/* 无数据 */
.no-properties {
  padding: 20px;
  text-align: center;
  color: var(--color-text-sub);
  font-style: italic;
  background: var(--color-bg-subtle);
  border-radius: 6px;
  border: 1px dashed var(--color-border);
}
</style>