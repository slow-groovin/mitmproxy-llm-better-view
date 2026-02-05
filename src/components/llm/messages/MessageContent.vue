<script setup lang="ts">
import { computed } from 'vue';
import ProseContent from '../shared/ProseContent.vue';
import TextBlock from './blocks/TextBlock.vue';
import ImageBlock from './blocks/ImageBlock.vue';
import ToolUseBlock from './blocks/ToolUseBlock.vue';
import ToolResultBlock from './blocks/ToolResultBlock.vue';
import ThinkingBlock from './blocks/ThinkingBlock.vue';
import FunctionCallBlock from './blocks/FunctionCallBlock.vue';
import { hashId } from '../../../utils/id/hashId';

type Platform = 'openai' | 'claude' | 'gemini';

// OpenAI content types
type OpenaiContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }> | null;

// Claude content types
interface ClaudeContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  signature?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
}

type ClaudeContent = string | ClaudeContentBlock[];

// Gemini content types
interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  fileData?: { mimeType: string; fileUri: string };
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  executableCode?: { language: string; code: string };
  codeExecutionResult?: { outcome: string; output: string };
  thought?: boolean;
  thoughtSignature?: string;
}

interface GeminiContent {
  parts: GeminiPart[];
}

interface Props {
  content: OpenaiContent | ClaudeContent | GeminiContent | unknown;
  platform: Platform;
}

const props = defineProps<Props>();

// Parse OpenAI content
const openaiContent = computed(() => {
  if (props.platform !== 'openai') return null;
  const content = props.content as OpenaiContent;

  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }

  if (Array.isArray(content)) {
    return content.map((item, index) => ({
      id: `openai-content-${index}`,
      ...item
    }));
  }

  return [];
});

// Parse Claude content
const claudeContent = computed(() => {
  if (props.platform !== 'claude') return null;
  const content = props.content as ClaudeContent;

  if (typeof content === 'string') {
    return [{ type: 'text', text: content, id: 'claude-content-0' }];
  }

  if (Array.isArray(content)) {
    return content.map((item, index) => ({
      id: item.id || `claude-content-${index}`,
      ...item
    }));
  }

  return [];
});

// Parse Gemini content
const geminiContent = computed(() => {
  if (props.platform !== 'gemini') return null;
  const content = props.content as GeminiContent;

  if (content && 'parts' in content && Array.isArray(content.parts)) {
    return content.parts.map((part, index) => ({
      id: `gemini-part-${index}`,
      ...part
    }));
  }

  return [];
});
</script>

<template>
  <div class="message-content">
    <!-- OpenAI content -->
    <template v-if="platform === 'openai' && openaiContent">
      <template v-for="item in openaiContent" :key="item.id || hashId(JSON.stringify(item))">
        <TextBlock
          v-if="item.type === 'text' && item.text"
          :id="item.id || hashId(item.text)"
          :text="item.text"
          is-prose
        />
        <ImageBlock
          v-else-if="item.type === 'image_url' && item.image_url?.url"
          :id="item.id || hashId(item.image_url.url)"
          :url="item.image_url.url"
        />
      </template>
    </template>

    <!-- Claude content -->
    <template v-if="platform === 'claude' && claudeContent">
      <template v-for="item in claudeContent" :key="item.id">
        <TextBlock
          v-if="item.type === 'text' && item.text"
          :id="item.id"
          :text="item.text"
          is-prose
        />
        <ThinkingBlock
          v-else-if="item.type === 'thinking' && item.thinking"
          :id="item.id"
          :thinking="item.thinking"
          :signature="item.signature"
        />
        <ToolUseBlock
          v-else-if="item.type === 'tool_use'"
          :id="item.id"
          :name="item.name || ''"
          :input="item.input || {}"
        />
        <ToolResultBlock
          v-else-if="item.type === 'tool_result'"
          :id="item.id"
          :tool-use-id="item.tool_use_id || ''"
          :content="item.content || ''"
          :is-error="item.is_error"
        />
        <ImageBlock
          v-else-if="item.type === 'image' && item.source"
          :id="item.id"
          :mimeType="item.source.media_type"
          :data="item.source.data"
        />
      </template>
       </template>

    <!-- Gemini content -->
    <template v-if="platform === 'gemini' && geminiContent">
      <template v-for="item in geminiContent" :key="item.id">
        <TextBlock
          v-if="item.text"
          :id="item.id"
          :text="item.text"
          :is-prose="!item.thought"
        />
        <ImageBlock
          v-else-if="item.inlineData"
          :id="item.id"
          :mimeType="item.inlineData.mimeType"
          :data="item.inlineData.data"
        />
        <ImageBlock
          v-else-if="item.fileData"
          :id="item.id"
          :url="item.fileData.fileUri"
        />
        <FunctionCallBlock
          v-else-if="item.functionCall"
          :id="item.id"
          :name="item.functionCall.name"
          :args="item.functionCall.args || {}"
          :thought-signature="item.thoughtSignature"
        />
        <ToolResultBlock
          v-else-if="item.functionResponse"
          :id="item.id"
          :tool-use-id="item.functionResponse.name"
          :content="JSON.stringify(item.functionResponse.response, null, 2)"
        />
        <TextBlock
          v-else-if="item.executableCode"
          :id="item.id"
          :text="`\`\`\`${item.executableCode.language}\n${item.executableCode.code}\n\`\`\``"
          is-prose
        />
        <TextBlock
          v-else-if="item.codeExecutionResult"
          :id="item.id"
          :text="item.codeExecutionResult.output"
          is-prose
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
