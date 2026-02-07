<script setup lang="ts">
interface Props {
  expanded?: boolean; // true = 完整显示模式, false = 滚动模式
  title?: string;
}

withDefaults(defineProps<Props>(), {
  expanded: false,
  title: 'Toggle full height'
});

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    class="option-button"
    :class="{ active: expanded }"
    :title="title"
    type="button"
    @click="emit('click')"
  >
    <!-- Expanded: Show "Collapse" icon (Arrows pointing In) -->
    <svg
      v-if="expanded"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="4 14 12 6 20 14" />
      <line x1="12" y1="6" x2="12" y2="20" />
    </svg>

    <!-- Collapsed: Show "Expand" icon (Arrows pointing Out) -->
    <svg
      v-else
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  </button>
</template>

<style scoped>
.option-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.option-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.option-button.active {
  background-color: #eff6ff;
  border-color: #3b82f6;
  color: #2563eb;
}
</style>