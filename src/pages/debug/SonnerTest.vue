<script setup lang="ts">
import { toast } from 'vue-sonner';
import { markRaw } from 'vue';
import { h } from 'vue';

const CustomToast = {
  render() {
    return h('div', {
      style: {
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '8px'
      }
    }, [
      h('h3', { style: { margin: 0 } }, 'Custom Toast'),
      h('p', { style: { margin: '8px 0 0' } }, 'This is a custom component')
    ])
  }
};

function showSuccessToast() {
  toast.success('Event has been created', {
    description: 'Monday, January 3rd at 6:00pm'
  });
}

function showErrorToast() {
  toast.error('Something went wrong');
}

function showInfoToast() {
  toast.info('This is an info message');
}

function showWarningToast() {
  toast.warning('This is a warning');
}

function showLoadingToast() {
  const myPromise = () => new Promise((resolve) => {
    setTimeout(() => resolve({ name: 'John' }), 2000);
  });

  toast.promise(myPromise, {
    loading: 'Loading...',
    success: (data: any) => `Welcome ${data.name}!`,
    error: 'Something went wrong'
  });
}

function showPersistentToast() {
  toast('Important notification', {
    duration: Infinity
  });
}

function showCustomToast() {
  toast.custom(markRaw(CustomToast), {
    duration: 5000
  });
}

function dismissAllToasts() {
  toast.dismiss();
}
</script>

<template>
  <div class="sonner-test">
    <div class="test-header">
      <h2>Vue Sonner Test</h2>
      <p>Test various toast notification types</p>
    </div>
    <div class="test-grid">
      <button class="test-btn success" @click="showSuccessToast">Success Toast</button>
      <button class="test-btn error" @click="showErrorToast">Error Toast</button>
      <button class="test-btn info" @click="showInfoToast">Info Toast</button>
      <button class="test-btn warning" @click="showWarningToast">Warning Toast</button>
      <button class="test-btn loading" @click="showLoadingToast">Loading Toast (Promise)</button>
      <button class="test-btn persistent" @click="showPersistentToast">Persistent Toast</button>
      <button class="test-btn custom" @click="showCustomToast">Custom Toast</button>
      <button class="test-btn dismiss" @click="dismissAllToasts">Dismiss All</button>
    </div>
  </div>
</template>

<style scoped>
.sonner-test {
  padding: 20px;
  overflow-y: auto;
}

.test-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #555;
  padding-bottom: 16px;
}

.test-header h2 {
  margin: 0 0 8px 0;
  color: #667eea;
}

.test-header p {
  margin: 0;
  color: #aaa;
}

.test-grid {
    display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.test-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.test-btn:active {
  transform: translateY(0);
}

.test-btn.success {
  background: #10b981;
  color: white;
}

.test-btn.error {
  background: #ef4444;
  color: white;
}

.test-btn.info {
  background: #3b82f6;
  color: white;
}

.test-btn.warning {
  background: #f59e0b;
  color: white;
}

.test-btn.loading {
  background: #8b5cf6;
  color: white;
}

.test-btn.persistent {
  background: #ec4899;
  color: white;
}

.test-btn.custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.test-btn.dismiss {
  background: #6b7280;
  color: white;
  grid-column: span 2;
}
</style>
