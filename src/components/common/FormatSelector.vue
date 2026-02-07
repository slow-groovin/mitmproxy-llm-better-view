<script setup lang="ts">
import { ref } from 'vue';
import type { ContentFormat } from '@/utils/format/formatContent';

interface Props {
  currentFormat: ContentFormat;
}

defineProps<Props>();

const emit = defineEmits<{
  select: [format: ContentFormat];
}>();

const isOpen = ref(false);
let closeTimeout: ReturnType<typeof setTimeout> | null = null;

const formats: ContentFormat[] = ['markdown', 'json', 'xml', 'text'];

const handleSelect = (format: ContentFormat) => {
  emit('select', format);
  closeDropdown();
};

const openDropdown = () => {
  clearCloseTimeout();
  isOpen.value = true;
};

const scheduleClose = () => {
  closeTimeout = setTimeout(() => {
    isOpen.value = false;
  }, 200);
};

const clearCloseTimeout = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
};

const closeDropdown = () => {
  clearCloseTimeout();
  isOpen.value = false;
};
</script>

<template>
  <div class="format-selector" @mouseenter="openDropdown" @mouseleave="scheduleClose">
    <span class="format-label">{{ currentFormat }}</span>

    <transition name="dropdown">
      <div v-if="isOpen" class="format-dropdown">
        <button v-for="fmt in formats" :key="fmt" class="format-option" :class="{ active: currentFormat === fmt }"
          @click="handleSelect(fmt)">
          {{ fmt }}
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.format-selector {
  position: relative;
  display: inline-flex;
  pointer-events: auto;
}

.format-label {
  font-size: 0.85rem;
  color: #64748b;
  font-family: ui-monospace, monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  padding: 2px 2px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-label:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
}

.format-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  overflow: hidden;
  pointer-events: auto;
  z-index: 9999;
  /* 👈 添加这行 */
}

.format-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  border: none;
  background: none;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
  font-family: ui-monospace, monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.format-option:hover {
  background: #f1f5f9;
}

.format-option.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>