<script setup lang="ts">
import OpenaiChatRequestView from './OpenaiChatRequestView.vue';
import type { OpenaiChatRequest } from '@/types/openai/chat-request';

interface Props {
  // OpenAI Chat request 视图只处理 chat/completions 请求。
  data: OpenaiChatRequest;
}

defineProps<Props>();
</script>

<template>
  <OpenaiChatRequestView :data="data" />
</template>
