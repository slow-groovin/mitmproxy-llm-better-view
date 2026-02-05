import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 示例用户信息类型
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

// 示例应用状态类型
export interface AppState {
  isLoading: boolean;
  lastUpdated: Date | null;
  notifications: string[];
}

export const useDebugStore = defineStore('debug', () => {
  // ========== State ==========
  const count = ref<number>(0);
  const user = ref<User | null>(null);
  const appState = ref<AppState>({
    isLoading: false,
    lastUpdated: null,
    notifications: []
  });
  const items = ref<string[]>(['item-1', 'item-2', 'item-3']);

  // ========== Getters ==========
  const doubleCount = computed(() => count.value * 2);
  
  const isLoggedIn = computed(() => user.value !== null);
  
  const userDisplayName = computed(() => {
    if (!user.value) return 'Guest';
    return user.value.name || user.value.email;
  });
  
  const notificationCount = computed(() => appState.value.notifications.length);
  
  const sortedItems = computed(() => [...items.value].sort());

  // ========== Actions ==========
  function increment() {
    count.value++;
  }

  function decrement() {
    count.value--;
  }

  function incrementBy(amount: number) {
    count.value += amount;
  }

  function resetCount() {
    count.value = 0;
  }

  function setUser(userData: User | null) {
    user.value = userData;
  }

  function updateUser(updates: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...updates };
    }
  }

  function setLoading(isLoading: boolean) {
    appState.value.isLoading = isLoading;
    if (!isLoading) {
      appState.value.lastUpdated = new Date();
    }
  }

  function addNotification(message: string) {
    appState.value.notifications.push(message);
  }

  function removeNotification(index: number) {
    appState.value.notifications.splice(index, 1);
  }

  function clearNotifications() {
    appState.value.notifications = [];
  }

  function addItem(item: string) {
    items.value.push(item);
  }

  function removeItem(index: number) {
    items.value.splice(index, 1);
  }

  function clearItems() {
    items.value = [];
  }

  function $reset() {
    count.value = 0;
    user.value = null;
    appState.value = {
      isLoading: false,
      lastUpdated: null,
      notifications: []
    };
    items.value = ['item-1', 'item-2', 'item-3'];
  }

  return {
    // State
    count,
    user,
    appState,
    items,
    // Getters
    doubleCount,
    isLoggedIn,
    userDisplayName,
    notificationCount,
    sortedItems,
    // Actions
    increment,
    decrement,
    incrementBy,
    resetCount,
    setUser,
    updateUser,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    addItem,
    removeItem,
    clearItems,
    $reset
  };
});
