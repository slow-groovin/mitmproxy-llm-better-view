<script setup lang="ts">
import { ref } from 'vue';
import { initPageInjector, destroyPageInjector } from '../../lib/page-injector';

const isInjected = ref(false);

function handleInject() {
  try {
    initPageInjector();
    isInjected.value = true;
  } catch (error) {
    console.error('Failed to inject page:', error);
  }
}

function handleDestroy() {
  try {
    destroyPageInjector();
    isInjected.value = false;
  } catch (error) {
    console.error('Failed to destroy page:', error);
  }
}
</script>

<template>
  <div class="page-injector-test">
    <h2>Page Injector Test</h2>
    <div class="button-group">
      <button 
        class="inject-btn" 
        @click="handleInject"
        :disabled="isInjected"
      >
        {{ isInjected ? 'Injected' : 'Inject Dashboard' }}
      </button>
      <button 
        class="destroy-btn" 
        @click="handleDestroy"
        :disabled="!isInjected"
      >
        Destroy Dashboard
      </button>
    </div>
  </div>
</template>

<style scoped>
.page-injector-test {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.page-injector-test h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.button-group {
  display: flex;
  gap: 12px;
}

.button-group button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.inject-btn {
  background: #42b883;
  color: white;
}

.inject-btn:hover:not(:disabled) {
  background: #36a374;
}

.inject-btn:disabled {
  background: #a8d5c2;
  cursor: not-allowed;
}

.destroy-btn {
  background: #f44336;
  color: white;
}

.destroy-btn:hover:not(:disabled) {
  background: #d32f2f;
}

.destroy-btn:disabled {
  background: #e57373;
  cursor: not-allowed;
}
</style>
