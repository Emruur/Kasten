<script setup lang="ts">
import { computed } from 'vue'
import { useViewport } from '@/composables/useViewport'

const props = defineProps<{
  // Phase-B progress (0..1): the collage fades/drifts in over this range,
  // on the same timeline as the nav.
  progress: number
  // True once the transition has settled on the menu page.
  active: boolean
}>()

const viewport = useViewport()

// Cards are 4:5 portrait; `n` is the card WIDTH in abstract units and the
// number shown in the sketch. Height is derived as n * 5/4.
const CARD_RATIO = 5 / 4

const POSTERS = [
  '/Posters/WhatsApp%20Image%202026-07-17%20at%2021.56.33.jpeg',
  '/Posters/WhatsApp%20Image%202026-07-17%20at%2021.56.33%20(1).jpeg',
  '/Posters/WhatsApp%20Image%202026-07-17%20at%2021.56.33%20(2).jpeg',
  '/Posters/WhatsApp%20Image%202026-07-17%20at%2021.56.33%20(3).jpeg',
  '/Posters/WhatsApp%20Image%202026-07-17%20at%2021.56.33%20(4).jpeg',
]

// The scattered cluster from the sketch, in unit space (top-left x/y, size n).
// These are tuning constants — nudge by eye. min x/y are ~0 so the cluster's
// bounding box starts at the stage origin.
const CARDS = computed(() => {
  const isSmall = viewport.value.width <= 375
  if (isSmall) {
    return [
      { n: 4, x: 23.0, y: 0.0 },
      { n: 7, x: 20.0, y: 7.0 },
      { n: 8, x: 10.0, y: 9.0 },
      { n: 5, x: 3.0, y: 21.0 },
      { n: 10, x: 0.0, y: 28.0 },
    ]
  }
  return [
    { n: 4, x: 20.0, y: 0.0 },
    { n: 7, x: 17.0, y: 7.0 },
    { n: 8, x: 7.0, y: 9.0 },
    { n: 5, x: 0.0, y: 15.0 },
    { n: 10, x: 7.0, y: 21.0 },
  ]
})

// The stage is the bounding box of every card, so tweaking a card's x/y/n
// automatically resizes the stage — no duplicated dimensions.
const stageW = computed(() => Math.max(...CARDS.value.map((c) => c.x + c.n)))
const stageH = computed(() => Math.max(...CARDS.value.map((c) => c.y + c.n * CARD_RATIO)))

// Position + size each card as a percentage of the stage. Because the stage is
// locked to stageW:stageH, a percentage width and percentage height map to the
// same px-per-unit scale, so every card keeps its 4:5 shape at any stage size.
const cardStyles = computed(() => CARDS.value.map((c) => ({
  left: `${(c.x / stageW.value) * 100}%`,
  top: `${(c.y / stageH.value) * 100}%`,
  width: `${(c.n / stageW.value) * 100}%`,
  height: `${((c.n * CARD_RATIO) / stageH.value) * 100}%`,
})))

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const clamp01 = (value: number) => Math.min(Math.max(0, value), 1)

const stageStyle = computed(() => {
  const p = easeOut(clamp01(props.progress))
  return {
    '--stage-w': stageW.value,
    '--stage-h': stageH.value,
    opacity: p,
    // Small upward drift so it arrives with the nav.
    transform: `translate(-50%, calc(-50% + ${(1 - p) * 24}px))`,
  }
})
</script>

<template>
  <div class="collage-stage" :style="stageStyle" :aria-hidden="progress <= 0">
    <img
      v-for="(style, i) in cardStyles"
      :key="i"
      :src="POSTERS[i]"
      class="collage-card"
      :style="style"
      alt=""
    />
  </div>
</template>

<style scoped>
.collage-stage {
  position: fixed;
  top: 50%;
  left: 50%;
  aspect-ratio: var(--stage-w) / var(--stage-h);
  /* Fit within both axes of the free area: cap by height, but also by width
     (86vw translated into the equivalent height via the stage ratio) so the
     portrait cluster never spills past the viewport on wide or narrow screens. */
  height: min(66vh, 86vw * var(--stage-h) / var(--stage-w));
  z-index: 3;
  /* Placeholders are non-interactive; also keeps the gallery's hover/blink
     unaffected while the collage is faded out on the home page. */
  pointer-events: none;
  will-change: transform, opacity;
}

.collage-card {
  position: absolute;
  background: var(--card-placeholder);
  object-fit: cover;
}
</style>
