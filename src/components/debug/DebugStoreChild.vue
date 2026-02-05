<script setup lang="ts">
import { useDebugStore } from '../../store/debug';

// 使用共享的 debug store
const store = useDebugStore();

// 模拟用户数据
const mockUsers = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' as const },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' as const },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'guest' as const }
];

// 切换用户
function cycleUser() {
  const currentIndex = mockUsers.findIndex(u => u.id === store.user?.id);
  const nextIndex = (currentIndex + 1) % (mockUsers.length + 1);
  if (nextIndex === mockUsers.length) {
    store.setUser(null);
  } else {
    store.setUser(mockUsers[nextIndex]);
  }
}

// 更新用户角色
function cycleRole() {
  if (!store.user) return;
  const roles: ('admin' | 'user' | 'guest')[] = ['admin', 'user', 'guest'];
  const currentIndex = roles.indexOf(store.user.role);
  const nextRole = roles[(currentIndex + 1) % roles.length];
  store.updateUser({ role: nextRole });
}

// 添加通知
function addRandomNotification() {
  const messages = [
    'New message received',
    'User logged in',
    'Data updated',
    'Task completed',
    'Error occurred'
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  store.addNotification(`${randomMessage} at ${new Date().toLocaleTimeString()}`);
}

// 添加随机项目
function addRandomItem() {
  const items = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape'];
  const randomItem = items[Math.floor(Math.random() * items.length)];
  store.addItem(`${randomItem}-${Date.now()}`);
}
</script>

<template>
  <div class="debug-store-child">
    <h4>Store Child Component</h4>
    
    <!-- Count 控制区 -->
    <div class="control-section">
      <h5>Count Controls</h5>
      <div class="button-group">
        <button @click="store.decrement">-</button>
        <span class="value">{{ store.count }}</span>
        <button @click="store.increment">+</button>
      </div>
      <div class="button-group">
        <button @click="store.incrementBy(5)">+5</button>
        <button @click="store.incrementBy(10)">+10</button>
        <button @click="store.resetCount">Reset</button>
      </div>
      <p>Double Count: {{ store.doubleCount }}</p>
    </div>

    <!-- User 控制区 -->
    <div class="control-section">
      <h5>User Controls</h5>
      <div class="user-info" v-if="store.user">
        <p><strong>ID:</strong> {{ store.user.id }}</p>
        <p><strong>Name:</strong> {{ store.user.name }}</p>
        <p><strong>Email:</strong> {{ store.user.email }}</p>
        <p><strong>Role:</strong> {{ store.user.role }}</p>
      </div>
      <p v-else>Not logged in</p>
      <div class="button-group">
        <button @click="cycleUser">{{ store.user ? 'Switch User' : 'Login' }}</button>
        <button @click="cycleRole" :disabled="!store.user">Change Role</button>
        <button @click="store.setUser(null)" v-if="store.user">Logout</button>
      </div>
      <p>Display Name: {{ store.userDisplayName }}</p>
      <p>Is Logged In: {{ store.isLoggedIn }}</p>
    </div>

    <!-- Notifications 控制区 -->
    <div class="control-section">
      <h5>Notifications ({{ store.notificationCount }})</h5>
      <ul class="notification-list">
        <li v-for="(notification, index) in store.appState.notifications" :key="index">
          {{ notification }}
          <button @click="store.removeNotification(index)">×</button>
        </li>
      </ul>
      <div class="button-group">
        <button @click="addRandomNotification">Add Random</button>
        <button @click="store.clearNotifications" :disabled="store.notificationCount === 0">Clear All</button>
      </div>
    </div>

    <!-- Items 控制区 -->
    <div class="control-section">
      <h5>Items ({{ store.items.length }})</h5>
      <ul class="item-list">
        <li v-for="(item, index) in store.sortedItems" :key="index">
          {{ item }}
          <button @click="store.removeItem(index)">×</button>
        </li>
      </ul>
      <div class="button-group">
        <button @click="addRandomItem">Add Random</button>
        <button @click="store.clearItems" :disabled="store.items.length === 0">Clear All</button>
      </div>
    </div>

    <!-- 全局操作 -->
    <div class="control-section global-actions">
      <h5>Global Actions</h5>
      <div class="button-group">
        <button @click="store.$reset">Reset All</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-store-child {
  padding: 16px;
  color: #e0e0e0;
  max-height: 100%;
  overflow-y: auto;
}

h4 {
  margin: 0 0 16px 0;
  color: #4fc3f7;
  font-size: 18px;
}

h5 {
  margin: 0 0 12px 0;
  color: #81c784;
  font-size: 14px;
  border-bottom: 1px solid #444;
  padding-bottom: 4px;
}

.control-section {
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

button {
  padding: 6px 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #1976d2;
}

button:disabled {
  background: #555;
  cursor: not-allowed;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #ffeb3b;
  min-width: 40px;
  text-align: center;
}

.user-info {
  background: rgba(33, 150, 243, 0.1);
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.user-info p {
  margin: 4px 0;
  font-size: 13px;
}

.notification-list,
.item-list {
  list-style: none;
  padding: 0;
  margin: 0 0 8px 0;
  max-height: 120px;
  overflow-y: auto;
}

.notification-list li,
.item-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
  border-radius: 3px;
  font-size: 12px;
}

.notification-list li button,
.item-list li button {
  padding: 2px 6px;
  font-size: 11px;
  background: #f44336;
}

.global-actions button {
  background: #ff9800;
}

.global-actions button:hover {
  background: #f57c00;
}

p {
  margin: 4px 0;
  font-size: 13px;
  color: #b0b0b0;
}
</style>
