<script setup lang="ts">
import { computed } from 'vue'
import { swipeConfig } from '@/composables/usePageSwipe'

const props = defineProps<{
  // Phase-B progress (0..1): the menu items slide in over this range.
  progress: number
  // True once the transition has settled on the menu page.
  active: boolean
}>()

const items = ['ABOUT', 'EXHIBITIONS', 'ARTICLES', 'EVENTS']

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const clamp01 = (value: number) => Math.min(Math.max(0, value), 1)

const containerStyle = computed(() => ({
  right: `${swipeConfig.navRight}px`,
  bottom: `${swipeConfig.navBottom}px`,
  gap: `${swipeConfig.navGap}px`,
}))

// Each item slides in from the right and fades in, staggered so they arrive
// in sequence. Combining slide + opacity means navSlide is purely aesthetic
// (items never pop in partway).
const itemStyle = (i: number) => {
  const span = 1 - (items.length - 1) * swipeConfig.navStagger
  const pi = easeOut(clamp01((props.progress - i * swipeConfig.navStagger) / span))
  return {
    transform: `translate3d(${(1 - pi) * swipeConfig.navSlide}px, 0, 0)`,
    opacity: pi,
  }
}
</script>

<template>
  <nav class="site-nav" :style="containerStyle" :aria-hidden="progress <= 0">
    <span v-for="(label, i) in items" :key="label" class="site-nav-item" :style="itemStyle(i)">
      {{ label }}
    </span>
  </nav>
</template>

<style scoped>
.site-nav {
  position: fixed;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  /* Visual only for now — no navigation. */
  pointer-events: none;
}

.site-nav-item {
  color: var(--text);
  font-weight: 700;
  font-size: clamp(20px, 4vw, 34px);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.1;
  will-change: transform, opacity;
}
</style>
