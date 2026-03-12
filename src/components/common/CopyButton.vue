<script setup lang="ts">
import { toast } from 'vue-sonner';

interface Props {
  content: string;
  successMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  successMessage: 'Copied'
});

// 优先走原生 Clipboard API，失败时再降级到旧版复制方案。
const canUseClipboardApi = () => typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';

// 兼容 mitmweb 注入场景：某些上下文里 Clipboard API 不可用，但 `execCommand('copy')` 仍可工作。
const copyWithExecCommand = (content: string) => {
  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = content;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
};

const handleCopy = async () => {
  if (!props.content) return;

  try {
    if (canUseClipboardApi()) {
      await navigator.clipboard.writeText(props.content);
      toast.success(props.successMessage);
      return;
    }
  } catch {
    // 这里继续走兼容复制，不额外中断交互。
  }

  if (copyWithExecCommand(props.content)) {
    toast.success(props.successMessage);
    return;
  }

  toast.error('Copy failed');
};
</script>

<template>
  <button
    class="copy-btn"
    type="button"
    title="Copy"
    @click="handleCopy"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  </button>
</template>

<style scoped>
.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  cursor: pointer;
}

.copy-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

</style>
