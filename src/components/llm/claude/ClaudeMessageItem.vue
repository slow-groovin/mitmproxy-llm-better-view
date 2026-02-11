<script setup lang="ts">
import { hashId } from '@/utils/id/hashId';
import { computed } from 'vue';
import { type ContentBlock, type ClaudeMessage } from '../../../types/claude/claude-request';
import ImageBlock from '@/components/content/ImageBlock.vue';
import SmartViewer from '@/components/content/SmartViewer.vue';
import ClaudeToolUseArgs from './ClaudeToolUseArgs.vue';
import MessageItem from '../MessageItem.vue';
import SubMessageItem from '../SubMessageItem.vue';

interface Props {
  message: ClaudeMessage;
  index: number;
}

const props = defineProps<Props>();
// 生成消息唯一的 Hash ID
const msgHashId = hashId(JSON.stringify(props.message));

// 定义带 ID 的 Block 类型
type ExtendedBlock = Exclude<ContentBlock, string> & { id: string };

// 解析内容块，标准化为统一的格式，保留原始顺序
const contentBlocks = computed<ExtendedBlock[]>(() => {
  const content = props.message.content;
  if (!content) return [];

  // 如果是纯字符串，转为单个文本块
  if (typeof content === 'string') {
    return [{ type: 'text', text: content, id: 'content-0' }];
  }

  // 如果是数组，处理每一项并确保有 ID
  if (Array.isArray(content)) {
    return content.map((block, idx) => {
      // 兼容字符串形式的块
      if (typeof block === 'string') {
        return { type: 'text', text: block, id: `content-${idx}` };
      }
      return { 
        ...block, 
        // 优先使用原有的 ID (如 tool_use_id)，没有则生成
        id: (block as any).id || (block as any).tool_use_id || `content-${idx}` 
      };
    }) as ExtendedBlock[];
  }

  return [];
});

const hasContent = computed(() => contentBlocks.value.length > 0);
</script>

<template>
  <MessageItem 
    :count="message.content.length" 
    :data-as-text="JSON.stringify(message, null, 2)" 
    :index="String(index)"
    :role="message.role" 
    storage-prefix="claude-msg"
  >
    <div class="message-content-flow">
      <!-- 统一遍历 contentBlocks，按顺序渲染 -->
      <template v-for="(block, subIndex) in contentBlocks" :key="block.id">
        
        <!-- 1. Thinking Block (思考过程) -->
        <div v-if="block.type === 'thinking'" class="block-wrapper">
          <SubMessageItem 
            badge-type="thinking" 
            badge-text="THINKING"
            :index="`${index}-${subIndex + 1}`"
            :id="`${msgHashId}-${block.id}`"
          >
            <!-- 思考内容通常很长，放入 viewer -->
            <div class="reasoning-content">
              <SmartViewer :text="block.thinking" />
            </div>
          </SubMessageItem>
        </div>

        <!-- 2. Text Block (普通文本) -->
        <!-- 修改：将 Text Block 也包裹在 SubMessageItem 中 -->
        <div v-else-if="block.type === 'text'" class="block-wrapper">
          <SubMessageItem 
            badge-type="text" 
            badge-text="TEXT" 
            :index="`${index}-${subIndex + 1}`"
            :id="`${msgHashId}-${block.id}`"
          >
            <!-- 文本内容 -->
            <SmartViewer :text="block.text" />
          </SubMessageItem>
        </div>

        <!-- 3. Image Block (图片) -->
        <!-- 图片通常作为视觉展示，如果不强制要求包裹，保持原样可能更好看，如果也需要包裹请告诉我 -->
        <div v-else-if="block.type === 'image'" class="block-image">
          <ImageBlock :url="`data:${block.source.media_type};base64,${block.source.data}`" />
        </div>

        <!-- 4. Tool Use Block (工具调用) -->
        <div v-else-if="block.type === 'tool_use'" class="block-wrapper">
          <SubMessageItem 
            badge-type="tool" 
            badge-text="TOOL_USE" 
            :index="`${index}-${subIndex + 1}`" 
            :id="`${msgHashId}-${block.id}`"
          >
            <template #header>
              <span class="tool-name">{{ block.name }}</span>
            </template>
            <ClaudeToolUseArgs :input="block.input" />
          </SubMessageItem>
        </div>

        <!-- 5. Tool Result Block (工具结果) -->
        <div v-else-if="block.type === 'tool_result'" class="block-wrapper">
          <SubMessageItem 
            badge-type="tool" 
            badge-text="TOOL_RESULT"
            :index="`${index}-${subIndex + 1}`" 
            :id="`${msgHashId}-${block.tool_use_id}`"
          >
            <template #header>
              <span class="tool-id-ref">{{ block.tool_use_id }}</span>
            </template>
            
            <div class="tool-result-content">
              <!-- Case A: String Content -->
              <template v-if="typeof block.content === 'string'">
                <SmartViewer :text="block.content" />
              </template>
              
              <!-- Case B: Array Content (Mixed text/images) -->
              <template v-else-if="Array.isArray(block.content)">
                <div v-for="(item, i) in block.content" :key="i">
                  <SmartViewer v-if="item.type === 'text'" :text="item.text" />
                  <div v-else-if="item.type === 'image'" class="mini-image-placeholder">
                     [Image Result]
                  </div>
                </div>
              </template>
            </div>
          </SubMessageItem>
        </div>

      </template>

      <!-- 空内容占位 -->
      <div v-if="!hasContent" class="empty">No content</div>
    </div>
  </MessageItem>
</template>

<style scoped>
/* 容器通用间距 */
.block-wrapper {
  margin: var(--llm-spacing-md) 0;
}

.block-image {
  margin: var(--llm-spacing-md) 0;
  max-width: 400px;
}

.empty {
  color: var(--llm-text-muted);
  font-style: italic;
  padding: 8px 0;
}

/* 思考内容样式微调 */
.reasoning-content {
  color: var(--llm-text-secondary);
  font-style: italic;
}

/* Tool Use Header 样式 */
.tool-name {
  font-weight: 600;
  color: var(--llm-text-primary);
  font-family: var(--llm-font-mono);
}

/* Tool Result Header 样式 */
.tool-id-ref {
  font-family: var(--llm-font-mono);
  color: var(--llm-text-muted);
  font-size: 0.9rem;
}

.mini-image-placeholder {
  padding: 4px 8px;
  background: var(--llm-bg-hover);
  border: 1px dashed var(--llm-border-light);
  color: var(--llm-text-muted);
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
}
</style>