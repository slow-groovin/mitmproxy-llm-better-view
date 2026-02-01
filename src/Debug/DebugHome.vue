<script setup lang="ts">
</script>

<template>
  <div class="debug-home">
    <div class="debug-header">Debug Panel</div>
    <div class="debug-content">
      <p>Debug functions test entry</p>
    </div>
  </div>
</template>

<style scoped>
.debug-home {
  position: fixed;
  top: 0;
  left: 0;
  width: 50vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.debug-header {
  padding: 16px;
  background: #333;
  border-bottom: 1px solid #555;
  font-weight: 600;
  font-size: 18px;
}

.debug-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
</style>
