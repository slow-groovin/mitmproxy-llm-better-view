<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type { ApiStandard } from '@/types/flow';
import { useCurrentFlowStore } from '@/store/llm';
import Dashboard from './Dashboard.vue';
import UnknownStandardSelector from '@/components/llm/UnknownStandardSelector.vue';

const currentFlowStore = useCurrentFlowStore();
const { standard } = storeToRefs(currentFlowStore);

const handleManualStandardSelect = (newStandard: ApiStandard) => {
  // Unknown 场景手动指定标准后，切换到正式 Dashboard 渲染。
  currentFlowStore.updateStandard(newStandard);
};
</script>

<template>
  <Dashboard v-if="standard" />
  <div v-else class="unknown-dashboard-gate">
    <UnknownStandardSelector @select-standard="handleManualStandardSelect" />
  </div>
</template>

<style scoped>
.unknown-dashboard-gate {
  margin: 2rem 0;
}
</style>
