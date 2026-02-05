<script setup lang="ts">
import { ref, shallowRef, type Component } from 'vue';
import Tabs from '../../components/Tabs.vue';
import TestButton from '../../components/debug/TestButton.vue';
import SonnerTest from './SonnerTest.vue';
import BrowserPermissionTest from './BrowserPermissionTest.vue';
import LogTapeTest from './LogTapeTest.vue';
import PageInjectorTest from './PageInjectorTest.vue';
import TransferDebug from './TransferDebug.vue';

interface TabItem {
  name: string;
  component: Component;
}

// 位置状态
const position = ref<'left' | 'right'>('left');

// 切换位置
const togglePosition = () => {
  position.value = position.value === 'left' ? 'right' : 'left';
};

// 使用 shallowRef 避免深度响应式
const tabs = shallowRef<TabItem[]>([
  { name: 'TestButton', component: TestButton as Component },
  { name: 'Transfer', component: TransferDebug as Component },
  { name: 'SonnerTest', component: SonnerTest as Component },
  { name: 'BrowserPermission', component: BrowserPermissionTest as Component },
  { name: 'LogTape', component: LogTapeTest as Component },
  { name: 'PageInjector', component: PageInjectorTest as Component },
]);
</script>

<template>
  <div class="debug-home" :class="{ 'position-left': position === 'left', 'position-right': position === 'right' }">
    <div class="debug-header">
      <span>Debug Panel</span>
      <button class="toggle-btn" @click="togglePosition">
        {{ position === 'left' ? '→' : '←' }}
      </button>
    </div>
    <div class="debug-content">
      <Tabs :tabs="tabs" />
    </div>
  </div>
</template>

<style scoped>
.debug-home {
  position: fixed;
  top: 0;
  width: 50vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.debug-home.position-left {
  left: 0;
}

.debug-home.position-right {
  right: 0;
}

.debug-header {
  padding: 16px;
  background: #333;
  border-bottom: 1px solid #555;
  font-weight: 600;
  font-size: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-btn {
  background: #555;
  border: 1px solid #777;
  color: white;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
  margin-right: 12rem;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #666;
}

.debug-content {
  flex: 1;
  overflow: hidden;
}
</style>
