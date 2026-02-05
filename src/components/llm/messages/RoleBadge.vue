<script setup lang="ts">
import { computed } from 'vue';

type Platform = 'openai' | 'claude' | 'gemini';

interface Props {
  role: string;
  platform?: Platform;
}

const props = withDefaults(defineProps<Props>(), {
  platform: 'openai'
});

const roleClass = computed(() => {
  const role = props.role.toLowerCase();
  if (role === 'model') return 'role-model';
  if (role === 'function') return 'role-function';
  return `role-${role}`;
});

const displayRole = computed(() => {
  const role = props.role.toLowerCase();
  if (role === 'model') return 'model';
  if (role === 'function') return 'function';
  return role;
});
</script>

<template>
  <span class="role-badge" :class="roleClass">{{ displayRole }}</span>
</template>

<style scoped>
.role-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-user {
  background: #dbeafe;
  color: #1d4ed8;
}

.role-assistant {
  background: #dcfce7;
  color: #166534;
}

.role-system {
  background: #fef3c7;
  color: #92400e;
}

.role-tool {
  background: #f3e8ff;
  color: #7c3aed;
}

.role-model {
  background: #dcfce7;
  color: #166534;
}

.role-function {
  background: #f3e8ff;
  color: #7c3aed;
}
</style>
