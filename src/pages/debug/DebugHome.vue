<script setup lang="ts">
import { shallowRef, type Component } from 'vue';
import Tabs from '../../components/Tabs.vue';
import TestButton from '../../components/debug/TestButton.vue';
import SonnerTest from './SonnerTest.vue';
import BrowserPermissionTest from './BrowserPermissionTest.vue';
import LogTapeTest from './LogTapeTest.vue';

interface TabItem {
  name: string;
  component: Component;
}

// 使用 shallowRef 避免深度响应式
const tabs = shallowRef<TabItem[]>([
  { name: 'TestButton', component: TestButton as Component },
  { name: 'SonnerTest', component: SonnerTest as Component },
  { name: 'BrowserPermission', component: BrowserPermissionTest as Component },
  { name: 'LogTape', component: LogTapeTest as Component },
]);
</script>

<template>
  <div class="debug-home">
    <div class="debug-header">Debug Panel</div>
    <div class="debug-content">
      <Tabs :tabs="tabs" />
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
  overflow: hidden;
}
</style>
