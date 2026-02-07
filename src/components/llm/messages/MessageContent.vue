<script setup lang="ts">
// MessageContent component - placeholder
</script>

<template>
  <div class="message-content">
    <slot />
  </div>
</template>

<style scoped>
.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
