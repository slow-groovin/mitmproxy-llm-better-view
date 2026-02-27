<script setup lang="ts">
import { computed } from 'vue';
import type { OpenaiChatRequest } from '@/types/openai/chat-request';
import type { OpenaiResponseRequest } from '@/types/openai-response/response-request';
import { isOpenaiResponseRequest, isOpenaiResponsesPath } from '@/types/openai-response/response-request';
import OpenaiChatRequestView from './OpenaiChatRequestView.vue';
// Responses API 专用视图拆分到独立目录，chat 视图继续复用原实现。
import OpenaiResponsesRequestView from '../openai-response/OpenaiResponsesRequestView.vue';

interface Props {
  data: OpenaiChatRequest | OpenaiResponseRequest;
  path?: string;
}

const props = defineProps<Props>();

// 视图分流：优先用结构判断，路径作为兜底。
const isResponsesRequest = computed(() => {
  return isOpenaiResponseRequest(props.data) || isOpenaiResponsesPath(props.path);
});

const responsesRequestData = computed(() => {
  if (!isResponsesRequest.value) {
    return null;
  }
  return props.data as OpenaiResponseRequest;
});

const chatRequestData = computed(() => {
  if (isResponsesRequest.value) {
    return null;
  }
  return props.data as OpenaiChatRequest;
});
</script>

<template>
  <OpenaiResponsesRequestView
    v-if="responsesRequestData"
    :data="responsesRequestData"
    :path="path"
  />
  <OpenaiChatRequestView
    v-else-if="chatRequestData"
    :data="chatRequestData"
  />
</template>
