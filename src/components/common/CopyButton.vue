<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import { toast } from 'vue-sonner';

interface Props {
  content: string;
  successMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  successMessage: 'Copied'
});

const { copy, isSupported } = useClipboard();

const handleCopy = async () => {
  if (!props.content) return;
  await copy(props.content);
  toast.success(props.successMessage);
};
</script>

<template>
  <button
    v-if="isSupported"
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
