<script setup lang="ts">
import { swipeConfig, resetSwipeConfig } from '@/composables/usePageSwipe'

defineProps<{
  page: 'home' | 'menu'
}>()

const emit = defineEmits<{
  go: [target: 0 | 1]
}>()

const sliders = [
  { key: 'durationMs', label: 'Duration (ms)', min: 100, max: 2000, step: 50 },
  { key: 'wheelThreshold', label: 'Wheel thresh', min: 20, max: 400, step: 10 },
  { key: 'wheelResetMs', label: 'Wheel reset (ms)', min: 50, max: 600, step: 10 },
  { key: 'settleMs', label: 'Settle (ms)', min: 0, max: 1500, step: 50 },
  { key: 'touchThreshold', label: 'Touch thresh', min: 20, max: 200, step: 5 },
  { key: 'phaseAEnd', label: 'Phase A end', min: 0.1, max: 1, step: 0.01 },
  { key: 'phaseBStart', label: 'Phase B start', min: 0, max: 0.9, step: 0.01 },
  { key: 'fadeStart', label: 'Fade start', min: 0, max: 0.9, step: 0.01 },
  { key: 'fadeEnd', label: 'Fade end', min: 0.1, max: 1, step: 0.01 },
  { key: 'logoMargin', label: 'Logo margin', min: 0, max: 120, step: 2 },
  { key: 'logoMarginLeft', label: 'Logo left (sm)', min: 0, max: 120, step: 2 },
  { key: 'logoSmallMaxWidth', label: 'Small max w', min: 640, max: 1600, step: 20 },
  { key: 'logoShift', label: 'Logo shift', min: 0, max: 0.5, step: 0.005 },
  { key: 'navRight', label: 'Nav right', min: 0, max: 200, step: 4 },
  { key: 'navBottom', label: 'Nav bottom', min: 0, max: 400, step: 4 },
  { key: 'navGap', label: 'Nav gap', min: 0, max: 40, step: 2 },
  { key: 'navSlide', label: 'Nav slide', min: 100, max: 900, step: 20 },
  { key: 'navStagger', label: 'Nav stagger', min: 0, max: 0.3, step: 0.01 },
] as const
</script>

<template>
  <aside class="dev-panel swipe-panel">
    <div class="dev-panel-header">
      <span>swipe</span>
      <button type="button" @click="resetSwipeConfig">reset</button>
    </div>
    <div class="go-row">
      <button type="button" :disabled="page === 'menu'" @click="emit('go', 1)">→ menu</button>
      <button type="button" :disabled="page === 'home'" @click="emit('go', 0)">→ home</button>
    </div>
    <label v-for="s in sliders" :key="s.key">
      <span class="name">{{ s.label }}</span>
      <input
        v-model.number="swipeConfig[s.key]"
        type="range"
        :min="s.min"
        :max="s.max"
        :step="s.step"
      />
      <span class="value">{{ swipeConfig[s.key] }}</span>
    </label>
  </aside>
</template>

<style scoped>
.dev-panel {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  background-color: var(--bg);
  color: var(--text);
  border: 1px solid var(--text);
  font-family: monospace;
  font-size: 12px;
}

.dev-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dev-panel-header button,
.go-row button {
  background: none;
  border: 1px solid var(--text);
  color: var(--text);
  font: inherit;
  padding: 1px 6px;
  cursor: pointer;
}

.go-row {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.go-row button {
  flex: 1;
  padding: 3px 6px;
}

.go-row button:disabled {
  opacity: 0.4;
  cursor: default;
}

.dev-panel label {
  display: grid;
  grid-template-columns: 90px 120px 42px;
  align-items: center;
  gap: 8px;
}

.dev-panel .value {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.dev-panel input[type='range'] {
  accent-color: var(--text);
}
</style>
