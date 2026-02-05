<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 当前 URL 的响应式状态
const currentUrl = ref('');
const currentHash = ref('');
const updateCount = ref(0);

// 计算属性:解析 URL 各部分
const urlParts = computed(() => {
  try {
    const url = new URL(currentUrl.value || window.location.href);
    return {
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
    };
  } catch {
    return null;
  }
});

// 更新时间戳
const lastUpdateTime = ref('');

// 更新 URL 信息的函数
const updateUrlInfo = () => {
  currentUrl.value = window.location.href;
  currentHash.value = window.location.hash;
  updateCount.value++;
  lastUpdateTime.value = new Date().toLocaleTimeString();
};

// 监听 hashchange 事件
const handleHashChange = () => {
  updateUrlInfo();
};

// 监听 popstate 事件(浏览器前进/后退)
const handlePopState = () => {
  updateUrlInfo();
};

// 重写 history 方法以监听 pushState/replaceState
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

onMounted(() => {
  // 初始化 URL 信息
  updateUrlInfo();

  // 添加事件监听
  window.addEventListener('hashchange', handleHashChange);
  window.addEventListener('popstate', handlePopState);

  // 重写 pushState
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    updateUrlInfo();
  };

  // 重写 replaceState
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    updateUrlInfo();
  };
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('hashchange', handleHashChange);
  window.removeEventListener('popstate', handlePopState);

  // 恢复原始 history 方法
  history.pushState = originalPushState;
  history.replaceState = originalReplaceState;
});
</script>

<template>
  <div class="url-listen-debug">
    <h3>URL 监听调试</h3>

    <!-- 基本信息 -->
    <div class="info-section">
      <div class="info-row">
        <span class="label">完整 URL:</span>
        <span class="value url-value">{{ currentUrl || 'N/A' }}</span>
      </div>
      <div class="info-row">
        <span class="label">Hash:</span>
        <span class="value">{{ currentHash || 'N/A' }}</span>
      </div>
      <div class="info-row">
        <span class="label">更新次数:</span>
        <span class="value">{{ updateCount }}</span>
      </div>
      <div class="info-row">
        <span class="label">最后更新:</span>
        <span class="value">{{ lastUpdateTime }}</span>
      </div>
    </div>

    <!-- URL 解析 -->
    <div v-if="urlParts" class="parsed-section">
      <h4>URL 解析</h4>
      <div class="parsed-grid">
        <div class="parsed-item">
          <span class="parsed-label">Protocol</span>
          <span class="parsed-value">{{ urlParts.protocol }}</span>
        </div>
        <div class="parsed-item">
          <span class="parsed-label">Host</span>
          <span class="parsed-value">{{ urlParts.host }}</span>
        </div>
        <div class="parsed-item">
          <span class="parsed-label">Hostname</span>
          <span class="parsed-value">{{ urlParts.hostname }}</span>
        </div>
        <div class="parsed-item">
          <span class="parsed-label">Port</span>
          <span class="parsed-value">{{ urlParts.port || 'default' }}</span>
        </div>
        <div class="parsed-item full-width">
          <span class="parsed-label">Pathname</span>
          <span class="parsed-value">{{ urlParts.pathname }}</span>
        </div>
        <div class="parsed-item full-width">
          <span class="parsed-label">Search</span>
          <span class="parsed-value">{{ urlParts.search || 'N/A' }}</span>
        </div>
        <div class="parsed-item full-width">
          <span class="parsed-label">Hash</span>
          <span class="parsed-value">{{ urlParts.hash || 'N/A' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.url-listen-debug {
  padding: 16px;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #667eea;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

h4 {
  margin: 16px 0 12px 0;
  font-size: 14px;
  color: #aaa;
}

.info-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
}

.info-row {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  min-width: 100px;
  color: #888;
  font-size: 12px;
  font-weight: 500;
}

.value {
  color: #fff;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  word-break: break-all;
}

.url-value {
  color: #667eea;
}

.parsed-section {
  margin-top: 16px;
}

.parsed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
}

.parsed-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

.parsed-item.full-width {
  grid-column: 1 / -1;
}

.parsed-label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.parsed-value {
  font-size: 12px;
  color: #fff;
  font-family: 'Monaco', 'Menlo', monospace;
  word-break: break-all;
}
</style>
