<script setup lang="ts">
import { computed } from 'vue';


interface Props {
  role: string;
}

const props = withDefaults(defineProps<Props>(), {
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
  border-radius: var(--llm-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-user {
  background: var(--llm-badge-user-bg);
  color: var(--llm-badge-user-text);
}

.role-assistant {
  background: var(--llm-badge-assistant-bg);
  color: var(--llm-badge-assistant-text);
}

.role-system {
  background: var(--llm-badge-system-bg);
  color: var(--llm-badge-system-text);
}

/* Responses API 常见 developer 角色，单独给出可读性更高的视觉区分。 */
.role-developer {
  background: #e0e7ff;
  color: #4338ca;
}

.role-tool {
  background: var(--llm-badge-tool-bg);
  color: var(--llm-badge-tool-text);
}

.role-model {
  background: var(--llm-badge-model-bg);
  color: var(--llm-badge-model-text);
}

.role-function {
  background: var(--llm-badge-tool-bg);
  color: var(--llm-badge-tool-text);
}
</style>
