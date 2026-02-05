<script setup lang="ts">
import { useDebugStore } from '../../store/debug';
import DebugStoreChild from '../../components/debug/DebugStoreChild.vue';

// 使用共享的 debug store
const store = useDebugStore();
</script>

<template>
  <div class="debug-store-page">
    <h3>Pinia Store Debug Page</h3>
    
    <!-- 父组件展示区 -->
    <div class="parent-section">
      <h4>Parent Component (DebugStorePage)</h4>
      
      <!-- 状态概览 -->
      <div class="state-overview">
        <h5>Current Store State</h5>
        <div class="state-grid">
          <div class="state-item">
            <span class="label">Count:</span>
            <span class="value">{{ store.count }}</span>
          </div>
          <div class="state-item">
            <span class="label">Double:</span>
            <span class="value">{{ store.doubleCount }}</span>
          </div>
          <div class="state-item">
            <span class="label">Logged In:</span>
            <span class="value" :class="{ 'status-true': store.isLoggedIn, 'status-false': !store.isLoggedIn }">
              {{ store.isLoggedIn }}
            </span>
          </div>
          <div class="state-item">
            <span class="label">Display Name:</span>
            <span class="value">{{ store.userDisplayName }}</span>
          </div>
          <div class="state-item">
            <span class="label">Notifications:</span>
            <span class="value">{{ store.notificationCount }}</span>
          </div>
          <div class="state-item">
            <span class="label">Items Count:</span>
            <span class="value">{{ store.items.length }}</span>
          </div>
          <div class="state-item full-width">
            <span class="label">Loading:</span>
            <span class="value" :class="{ 'status-true': store.appState.isLoading, 'status-false': !store.appState.isLoading }">
              {{ store.appState.isLoading }}
            </span>
          </div>
          <div class="state-item full-width" v-if="store.appState.lastUpdated">
            <span class="label">Last Updated:</span>
            <span class="value">{{ store.appState.lastUpdated.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- 用户信息展示区 -->
      <div class="user-display" v-if="store.user">
        <h5>Current User</h5>
        <div class="user-card">
          <div class="user-field">
            <span class="field-label">ID:</span>
            <span class="field-value">{{ store.user.id }}</span>
          </div>
          <div class="user-field">
            <span class="field-label">Name:</span>
            <span class="field-value">{{ store.user.name }}</span>
          </div>
          <div class="user-field">
            <span class="field-label">Email:</span>
            <span class="field-value">{{ store.user.email }}</span>
          </div>
          <div class="user-field">
            <span class="field-label">Role:</span>
            <span class="field-value role-badge" :class="`role-${store.user.role}`">{{ store.user.role }}</span>
          </div>
        </div>
      </div>

      <!-- 通知列表 -->
      <div class="notifications-display" v-if="store.appState.notifications.length > 0">
        <h5>Notifications ({{ store.notificationCount }})</h5>
        <ul class="notification-list">
          <li v-for="(notification, index) in store.appState.notifications" :key="index" class="notification-item">
            <span class="notification-text">{{ notification }}</span>
            <button class="remove-btn" @click="store.removeNotification(index)">×</button>
          </li>
        </ul>
      </div>

      <!-- 项目列表 -->
      <div class="items-display" v-if="store.items.length > 0">
        <h5>Items ({{ store.items.length }})</h5>
        <ul class="item-list">
          <li v-for="(item, index) in store.sortedItems" :key="index" class="item">
            <span class="item-text">{{ item }}</span>
            <button class="remove-btn" @click="store.removeItem(store.items.indexOf(item))">×</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- 子组件分割线 -->
    <div class="child-divider">
      <span>Child Component Below</span>
    </div>

    <!-- 子组件 -->
    <DebugStoreChild />
  </div>
</template>

<style scoped>
.debug-store-page {
  padding: 16px;
  color: #e0e0e0;
  max-height: 100%;
  overflow-y: auto;
}

h3 {
  margin: 0 0 16px 0;
  color: #4fc3f7;
  font-size: 20px;
  border-bottom: 2px solid #4fc3f7;
  padding-bottom: 8px;
}

h4 {
  margin: 0 0 12px 0;
  color: #81c784;
  font-size: 16px;
}

h5 {
  margin: 0 0 8px 0;
  color: #ffb74d;
  font-size: 13px;
  border-bottom: 1px solid #444;
  padding-bottom: 4px;
}

.parent-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.state-overview {
  margin-bottom: 16px;
}

.state-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.state-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-size: 12px;
}

.state-item.full-width {
  grid-column: 1 / -1;
}

.state-item .label {
  color: #888;
}

.state-item .value {
  color: #4fc3f7;
  font-weight: 600;
}

.status-true {
  color: #81c784 !important;
}

.status-false {
  color: #ef5350 !important;
}

.user-display {
  margin-bottom: 16px;
}

.user-card {
  background: rgba(33, 150, 243, 0.1);
  border-radius: 6px;
  padding: 12px;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.user-field {
  display: flex;
  margin-bottom: 6px;
}

.user-field:last-child {
  margin-bottom: 0;
}

.field-label {
  color: #888;
  min-width: 60px;
  font-size: 12px;
}

.field-value {
  color: #e0e0e0;
  font-size: 12px;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
}

.role-admin {
  background: #f44336;
  color: white;
}

.role-user {
  background: #2196f3;
  color: white;
}

.role-guest {
  background: #9e9e9e;
  color: white;
}

.notifications-display,
.items-display {
  margin-bottom: 16px;
}

.notification-list,
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.notification-item,
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 12px;
}

.notification-text,
.item-text {
  flex: 1;
  margin-right: 8px;
  word-break: break-all;
}

.remove-btn {
  padding: 2px 6px;
  font-size: 14px;
  line-height: 1;
  background: #f44336;
  min-width: auto;
}

.remove-btn:hover {
  background: #d32f2f;
}

.child-divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.child-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #4fc3f7, transparent);
}

.child-divider span {
  position: relative;
  background: #1a1a1a;
  padding: 0 16px;
  color: #4fc3f7;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
