<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
    @click="toggle"
  >
    <span class="swatch" />
  </button>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  padding: 0;
  background-color: var(--bg);
  border: 1px solid var(--text);
  cursor: pointer;
}

.swatch {
  width: 14px;
  height: 14px;
  background-color: var(--text);
  transition: background-color 0.25s ease;
}
</style>
