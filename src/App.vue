<script setup lang="ts">
import { ref, shallowRef, type Component } from 'vue';
import TestButton from './components/debug/TestButton.vue';

const showDebug = ref(false);
const isDev=import.meta.env.DEV
const DebugHome = shallowRef<Component>();

async function toggleDebug() {
  if (!DebugHome.value) {
    const module = await import('./Debug/DebugHome.vue');
    DebugHome.value = module.default as Component;
  }
  showDebug.value = !showDebug.value;
}
</script>

<template>
  <div class="floating-panel">
    <TestButton/>
  </div>
  
  <template v-if="isDev">
    <button class="debug-toggle-btn" @click="toggleDebug">
      {{ showDebug ? 'Hide Debug' : 'Show Debug' }}
    </button>
  </template>
  
  <component :is="DebugHome" v-if="showDebug && DebugHome" />
</template>

<style scoped>
.debug-toggle-btn {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 8px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10001;
}

.debug-toggle-btn:hover {
  background: #5568d3;
}
</style>


