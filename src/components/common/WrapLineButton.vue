<script setup lang="ts">
interface Props {
  active?: boolean;
  title?: string;
}

withDefaults(defineProps<Props>(), {
  active: false,
  title: ''
});

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    class="option-button"
    :class="{ active }"
    :title="title"
    type="button"
    @click="emit('click')"
  >
    <!-- active=true: scroll mode (no wrap), active=false: wrap mode -->
    <svg
      v-if="active"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- Scroll icon (x-scroll mode) -->
      <path d="M4 7h16" />
      <path d="M4 12h12a4 4 0 0 1 0 8H4" />
    </svg>
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
      <!-- Wrap icon (pre-wrap mode) -->
      <path d="M4 7h16" />
      <path d="M4 12h12a4 4 0 0 1 0 8H4" />
      <path d="M9 17l-4-5 4-5" />
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
  opacity: 1;
}

/* Show button when parent is hovered */
:deep(.text-block-header:hover) .option-button,
:deep(.viewer-toolbar:hover) .option-button {
  opacity: 1;
}
</style>
