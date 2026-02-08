<script setup lang="ts">
import ViewDashboardProxy from '@/components/llm/ViewDashboardProxy.vue';
import { useCurrentFlowStore } from '@/store/llm';

const { standard, dataType, dataAsText } = useCurrentFlowStore()
</script>

<template>
  <details id="mitmproxy-llm-better-view-dash-container" class="llm-better-view" open>
    <summary>LLM Better View</summary>
    <view-dashboard-proxy v-if="standard && dataType && dataAsText" :standard="standard" :data-type="dataType"
      :data="dataAsText" />
  </details>
</template>

<style scoped></style>
