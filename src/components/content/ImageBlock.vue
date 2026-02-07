<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  id?: string;
  url?: string;
  mimeType?: string;
  data?: string; // base64 data
}

const props = defineProps<Props>();

const imageUrl = computed(() => {
  if (props.url) return props.url;
  if (props.data && props.mimeType) {
    return `data:${props.mimeType};base64,${props.data}`;
  }
  return '';
});

const hasError = ref(false);

function onError() {
  hasError.value = true;
}
</script>

<template>
  <div class="image-block">
    <div v-if="hasError" class="image-error">
      <span>Failed to load image</span>
      <span v-if="mimeType" class="image-mime">{{ mimeType }}</span>
    </div>
    <img
      v-else-if="imageUrl"
      :src="imageUrl"
      :alt="mimeType || 'Image'"
      class="image-image"
      loading="lazy"
      @error="onError"
    />
    <div v-else class="image-placeholder">
      <span>No image data available</span>
      <span v-if="mimeType" class="image-mime">{{ mimeType }}</span>
    </div>
  </div>
</template>

<style scoped>
.image-block {
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f8fafc;
}

.image-image {
  max-width: 100%;
  max-height: 400px;
  display: block;
  border-radius: 6px;
}

.image-placeholder,
.image-error {
  padding: 16px;
  text-align: center;
  color: #64748b;
  font-style: italic;
  border-radius: 6px;
  border: 2px dashed #e2e8f0;
}

.image-error {
  color: #dc2626;
  border-color: #fecaca;
}

.image-mime {
  display: block;
  font-size: 1.2rem;
  font-family: 'Monaco', 'Menlo', monospace;
  margin-top: 4px;
  color: #94a3b8;
}
</style>
