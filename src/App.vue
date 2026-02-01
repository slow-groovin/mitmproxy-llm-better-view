<script setup lang="ts">
import 'vue-sonner/style.css';
import { Toaster } from 'vue-sonner';
import { ref, shallowRef, type Component } from 'vue';

const showDebug = ref(false);
const isDev=import.meta.env.DEV
const DebugHome = shallowRef<Component>();

async function toggleDebug() {
  if (!DebugHome.value) {
    const module = await import('./pages/debug/DebugHome.vue');
    DebugHome.value = module.default as Component;
  }
  showDebug.value = !showDebug.value;
}
</script>

<template>
  <!-- <div class="floating-panel">
  </div> -->
  <Toaster  position="top-center"/>
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


