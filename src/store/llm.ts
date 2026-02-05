import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { DataType, ApiStandard, Flow } from '../types/flow';


export const useCurrentFlowStore = defineStore('current-store', () => {
  // State
  const standard = ref<ApiStandard>();
  const dataType = ref<DataType>();
  const dataAsText = ref<string>();
  const flow = ref<Flow>();

  // Getters
  const flowId=computed(()=>flow.value?.id);

  const hasValidData = computed(() => {
    return standard.value !== null && dataAsText.value !== null;
  });

  const currentTypeInfo = computed(() => {
    return {
      standard: standard.value,
      dataType: dataType.value
    };
  });

  // Actions
  function setLLMData(
    newStandard: ApiStandard,
    newDataType: DataType,
    newDataAsText: string,
    newFlow: Flow
  ) {
    standard.value = newStandard;
    dataType.value = newDataType;
    dataAsText.value = newDataAsText;
    flow.value = newFlow;
  }

  function reset() {
    standard.value = undefined;
    dataType.value = undefined;
    dataAsText.value = undefined;
    flow.value = undefined;
  }

  function updateDataType(newDataType: DataType) {
    dataType.value = newDataType;
  }

  function updateStandard(newStandard: ApiStandard) {
    standard.value = newStandard;
  }

  return {
    // State
    standard,
    dataType,
    dataAsText,
    flow,
    // Getters
    flowId,
    hasValidData,
    currentTypeInfo,
    // Actions
    setLLMData,
    reset,
    updateDataType,
    updateStandard
  };
});