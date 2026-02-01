<script setup lang="ts">
import { ref } from 'vue';
import { getLogger, getConsoleSink, configure, type Logger } from '@logtape/logtape';

const logs = ref<string[]>([]);
const isConfigured = ref(false);
let logger: Logger | null = null;

const configureLogTape = async () => {
  try {
    await configure({
      sinks: {
        console: getConsoleSink(),
      },
      loggers: [
        { category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'warning' },
        { category: ['app', 'debug'], sinks: ['console'], lowestLevel: 'debug' }
      ]
    });
    
    logger = getLogger(['app', 'debug']);
    isConfigured.value = true;
    addLog('LogTape configured successfully');
  } catch (error) {
    addLog(`Failed to configure LogTape: ${error}`);
  }
};

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.unshift(`[${timestamp}] ${message}`);
  
  if (logs.value.length > 100) {
    logs.value.pop();
  }
};

const logAtLevel = (level: string) => {
  if (!logger) {
    addLog('Logger not configured. Click "Configure LogTape" first.');
    return;
  }
  
  const message = `This is a ${level} message`;
  addLog(`Sent: ${level} - ${message}`);
  
  switch (level) {
    case 'trace':
      logger.trace `${message}`;
      break;
    case 'debug':
      logger.debug `${message}`;
      break;
    case 'info':
      logger.info `${message}`;
      break;
    case 'warn':
      logger.warn `${message}`;
      break;
    case 'error':
      logger.error `${message}`;
      break;
    case 'fatal':
      logger.fatal `${message}`;
      break;
  }
};

const testStructuredLogging = () => {
  if (!logger) {
    addLog('Logger not configured. Click "Configure LogTape" first.');
    return;
  }
  
  const user = { id: 1, name: 'Test User' };
  const data = { value: 42, items: ['a', 'b', 'c'] };
  
  logger.info `User action: ${user} performed with data: ${data}`;
  addLog('Sent structured logging with user and data objects');
};

const clearLogs = () => {
  logs.value = [];
};
</script>

<template>
  <div class="logtape-test">
    <div class="test-section">
      <h3>LogTape Configuration</h3>
      <button 
        @click="configureLogTape" 
        :disabled="isConfigured"
        class="btn"
      >
        {{ isConfigured ? 'Configured ✓' : 'Configure LogTape' }}
      </button>
    </div>

    <div class="test-section">
      <h3>Log Levels</h3>
      <div class="button-group">
        <button 
          v-for="level in ['trace', 'debug', 'info', 'warn', 'error', 'fatal']" 
          :key="level"
          @click="logAtLevel(level)"
          :disabled="!isConfigured"
          :class="['btn', `btn-${level}`]"
        >
          {{ level }}
        </button>
      </div>
    </div>

    <div class="test-section">
      <h3>Structured Logging</h3>
      <button 
        @click="testStructuredLogging" 
        :disabled="!isConfigured"
        class="btn"
      >
        Test Structured Log
      </button>
    </div>

    <div class="test-section">
      <div class="logs-header">
        <h3>Log History</h3>
        <button @click="clearLogs" class="btn btn-small">Clear</button>
      </div>
      <div class="logs-container">
        <div v-if="logs.length === 0" class="empty-logs">
          No logs yet. Configure LogTape and start logging.
        </div>
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logtape-test {
  padding: 16px;
  color: white;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.test-section {
  margin-bottom: 24px;
}

.test-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #88ccff;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn:hover:not(:disabled) {
  background: #2563eb;
}

.btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-trace { background: #6b7280; }
.btn-debug { background: #3b82f6; }
.btn-info { background: #22c55e; }
.btn-warn { background: #eab308; }
.btn-error { background: #f97316; }
.btn-fatal { background: #ef4444; }

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-container {
  background: #1e293b;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.empty-logs {
  color: #6b7280;
  text-align: center;
  padding: 20px;
}

.log-entry {
  padding: 4px 0;
  border-bottom: 1px solid #374151;
}

.log-entry:last-child {
  border-bottom: none;
}
</style>
