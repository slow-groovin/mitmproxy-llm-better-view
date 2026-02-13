<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  useStorage,
  useLocalStorage,
  useSessionStorage
} from '@vueuse/core';

interface PermissionStatus {
  name: string;
  state: string;
  supported: boolean;
}

interface StorageTest {
  type: string;
  key: string;
  value: string;
  action: string;
}

const permissions = ref<PermissionStatus[]>([
  { name: 'camera', state: 'unknown', supported: false },
  { name: 'microphone', state: 'unknown', supported: false },
  { name: 'geolocation', state: 'unknown', supported: false },
  { name: 'notifications', state: 'unknown', supported: false },
]);

const storageLogs = ref<StorageTest[]>([]);
const testInput = ref('');
const testKey = ref('test-key');

const localStorageValue = useLocalStorage('test-local', 'default-local-value');
const sessionStorageValue = useSessionStorage('test-session', 'default-session-value');
const genericStorageValue = useStorage('test-generic', { count: 0, name: 'test' });

const logStorageAction = (type: string, key: string, value: string, action: string) => {
  storageLogs.value.unshift({ type, key, value, action });
  if (storageLogs.value.length > 10) {
    storageLogs.value.pop();
  }
};

const checkPermissions = async () => {
  for (const perm of permissions.value) {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: perm.name as PermissionName });
        perm.supported = true;
        perm.state = result.state;
        
        result.addEventListener('change', () => {
          perm.state = result.state;
        });
      } else {
        perm.supported = false;
        perm.state = 'unsupported';
      }
    } catch (error) {
      perm.supported = false;
      perm.state = 'error';
    }
  }
};

const requestPermission = async (name: string) => {
  try {
    let result: PermissionState | MediaStream | GeolocationPosition | NotificationPermission;
    switch (name) {
      case 'camera':
        result = await navigator.mediaDevices.getUserMedia({ video: true });
        (result as MediaStream).getTracks().forEach(track => { track.stop(); });
        break;
      case 'microphone':
        result = await navigator.mediaDevices.getUserMedia({ audio: true });
        (result as MediaStream).getTracks().forEach(track => { track.stop(); });
        break;
      case 'geolocation':
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => { resolve(); },
            () => { resolve(); }
          );
        });
        break;
      case 'notifications':
        result = await Notification.requestPermission();
        break;
    }
    await checkPermissions();
  } catch (error) {
    console.error(`Error requesting ${name} permission:`, error);
  }
};

const testLocalStorageSet = () => {
  const key = testKey.value || 'test-key';
  const value = testInput.value || Date.now().toString();
  localStorage.setItem(key, value);
  logStorageAction('localStorage', key, value, 'set');
};

const testLocalStorageGet = () => {
  const key = testKey.value || 'test-key';
  const value = localStorage.getItem(key) || 'null';
  logStorageAction('localStorage', key, value, 'get');
};

const testLocalStorageRemove = () => {
  const key = testKey.value || 'test-key';
  localStorage.removeItem(key);
  logStorageAction('localStorage', key, '', 'remove');
};

const testSessionStorageSet = () => {
  const key = testKey.value || 'test-key';
  const value = testInput.value || Date.now().toString();
  sessionStorage.setItem(key, value);
  logStorageAction('sessionStorage', key, value, 'set');
};

const testSessionStorageGet = () => {
  const key = testKey.value || 'test-key';
  const value = sessionStorage.getItem(key) || 'null';
  logStorageAction('sessionStorage', key, value, 'get');
};

const testSessionStorageRemove = () => {
  const key = testKey.value || 'test-key';
  sessionStorage.removeItem(key);
  logStorageAction('sessionStorage', key, '', 'remove');
};

const testVueUseLocalStorage = () => {
  localStorageValue.value = testInput.value || 'vueuse-' + Date.now();
  logStorageAction('vueuse-localStorage', 'test-local', localStorageValue.value, 'set');
};

const testVueUseSessionStorage = () => {
  sessionStorageValue.value = testInput.value || 'vueuse-session-' + Date.now();
  logStorageAction('vueuse-sessionStorage', 'test-session', sessionStorageValue.value, 'set');
};

const testVueUseGenericStorage = () => {
  genericStorageValue.value = {
    count: (genericStorageValue.value.count || 0) + 1,
    name: testInput.value || 'generic-' + Date.now()
  };
  logStorageAction('vueuse-generic', 'test-generic', JSON.stringify(genericStorageValue.value), 'set');
};

const clearLogs = () => {
  storageLogs.value = [];
};

onMounted(() => {
  checkPermissions();
});
</script>

<template>
  <div class="browser-permission-test">
    <h3>Browser Permission Test</h3>
    
    <div class="section">
      <h4>Permission Status</h4>
      <div class="permission-list">
        <div v-for="perm in permissions" :key="perm.name" class="permission-item">
          <span class="perm-name">{{ perm.name }}</span>
          <span :class="['perm-state', perm.state]">{{ perm.state }}</span>
          <span class="perm-supported">{{ perm.supported ? '✓' : '✗' }}</span>
          <button 
            v-if="perm.supported && perm.state !== 'granted'" 
            @click="requestPermission(perm.name)"
            class="request-btn"
          >
            Request Permission
          </button>
        </div>
      </div>
    </div>

    <div class="section">
      <h4>VueUse Storage Auto Test</h4>
      <div class="storage-display">
        <div class="storage-item">
          <span class="label">useLocalStorage:</span>
          <span class="value">{{ localStorageValue }}</span>
        </div>
        <div class="storage-item">
          <span class="label">useSessionStorage:</span>
          <span class="value">{{ sessionStorageValue }}</span>
        </div>
        <div class="storage-item">
          <span class="label">useStorage (generic):</span>
          <span class="value">{{ JSON.stringify(genericStorageValue) }}</span>
        </div>
      </div>
      <div class="button-group">
        <button @click="testVueUseLocalStorage">Test useLocalStorage</button>
        <button @click="testVueUseSessionStorage">Test useSessionStorage</button>
        <button @click="testVueUseGenericStorage">Test useStorage</button>
      </div>
    </div>

    <div class="section">
      <h4>Native Storage Manual Test</h4>
      <div class="input-group">
        <input v-model="testKey" placeholder="Storage key" class="input-field" />
        <input v-model="testInput" placeholder="Storage value" class="input-field" />
      </div>
      
      <div class="button-group">
        <h5>localStorage</h5>
        <button @click="testLocalStorageSet">Set</button>
        <button @click="testLocalStorageGet">Get</button>
        <button @click="testLocalStorageRemove">Remove</button>
        
        <h5>sessionStorage</h5>
        <button @click="testSessionStorageSet">Set</button>
        <button @click="testSessionStorageGet">Get</button>
        <button @click="testSessionStorageRemove">Remove</button>
        
         <button @click="clearLogs" class="clear-btn">Clear Logs</button>
      </div>
    </div>

    <div class="section">
      <h4>Action Logs</h4>
      <div class="log-list">
        <div v-for="(log, index) in storageLogs" :key="index" class="log-item">
          <span class="log-type">{{ log.type }}</span>
          <span class="log-action">{{ log.action }}</span>
          <span class="log-key">{{ log.key }}</span>
          <span class="log-value">{{ log.value }}</span>
        </div>
         <div v-if="storageLogs.length === 0" class="empty-log">No logs</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.browser-permission-test {
  padding: 16px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #fff;
}

h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #ccc;
}

h5 {
  margin: 8px 0 4px 0;
  font-size: 12px;
  color: #999;
}

.section {
  margin-bottom: 24px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.perm-name {
  width: 100px;
  font-weight: 500;
}

.perm-state {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.perm-state.granted {
  background: #22c55e;
  color: white;
}

.perm-state.denied {
  background: #ef4444;
  color: white;
}

.perm-state.prompt.prompt {
  background: #f59e0b;
  color: white;
}

.perm-state.unsupported {
  background: #6b7280;
  color: white;
}

.perm-state.error {
  background: #dc2626;
  color: white;
}

.perm-supported {
  font-size: 16px;
}

.request-btn {
  padding: 4px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.request-btn:hover {
  background: #5568d3;
}

.storage-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.storage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.label {
  color: #22c55e;
  min-width: 140px;
}

.value {
  color: #fff;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.input-field {
  flex: 1;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  font-family: monospace;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

button {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

button:hover {
  background: #5568d3;
}

.clear-btn {
  background: #ef4444;
}

.clear-btn:hover {
  background: #dc2626;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
}

.log-type {
  color: #f59bb4;
  min-width: 100px;
}

.log-action {
  color: #22c55e;
  min-width: 40px;
  font-weight: 600;
}

.log-key {
  color: #60a5fa;
  min-width: 80px;
}

.log-value {
  color: #fff;
  flex: 1;
}

.empty-log {
  text-align: center;
  color: #666;
  padding: 16px;
}
</style>
