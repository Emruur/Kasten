<script setup lang="ts">
import { blinkConfig, resetBlinkConfig } from '@/composables/useBlink'

const sliders = [
  { key: 'litFraction', label: 'Lit fraction', min: 0.01, max: 0.5, step: 0.01 },
  { key: 'minOnMs', label: 'Min on (ms)', min: 100, max: 5000, step: 100 },
  { key: 'maxOnMs', label: 'Max on (ms)', min: 100, max: 8000, step: 100 },
  { key: 'tickMs', label: 'Tick (ms)', min: 50, max: 1000, step: 50 },
  { key: 'maxLitPerTick', label: 'Max lit / tick', min: 1, max: 10, step: 1 },
  { key: 'distanceFalloff', label: 'Logo falloff', min: 0, max: 4, step: 0.1 },
  { key: 'fadeMs', label: 'Fade (ms)', min: 0, max: 2000, step: 50 },
  { key: 'cooldownMs', label: 'Cooldown (ms)', min: 0, max: 5000, step: 100 },
  { key: 'trailMs', label: 'Trail (ms)', min: 0, max: 5000, step: 100 },
  { key: 'swapChance', label: 'Swap chance', min: 0, max: 1, step: 0.05 },
  { key: 'locationMoveMs', label: 'Loc move (ms)', min: 1000, max: 20000, step: 500 },
] as const
</script>

<template>
  <aside class="dev-panel">
    <div class="dev-panel-header">
      <span>blink</span>
      <button type="button" @click="resetBlinkConfig">reset</button>
    </div>
    <label v-for="s in sliders" :key="s.key">
      <span class="name">{{ s.label }}</span>
      <input
        v-model.number="blinkConfig[s.key]"
        type="range"
        :min="s.min"
        :max="s.max"
        :step="s.step"
      />
      <span class="value">{{ blinkConfig[s.key] }}</span>
    </label>
  </aside>
</template>

<style scoped>
.dev-panel {
  position: fixed;
  top: 16px;
  right: 16px;
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

.dev-panel-header button {
  background: none;
  border: 1px solid var(--text);
  color: var(--text);
  font: inherit;
  padding: 1px 6px;
  cursor: pointer;
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
