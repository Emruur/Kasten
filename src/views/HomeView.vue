<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ArtCard from '@/components/ArtCard.vue'
import BlinkDevPanel from '@/components/BlinkDevPanel.vue'
import CollageCards from '@/components/CollageCards.vue'
import LocationCard from '@/components/LocationCard.vue'
import LogoCard from '@/components/LogoCard.vue'
import SiteNav from '@/components/SiteNav.vue'
import SwipeDevPanel from '@/components/SwipeDevPanel.vue'
import { blinkConfig, useBlink } from '@/composables/useBlink'
import { useHoverTrail } from '@/composables/useHoverTrail'
import { usePageSwipe, swipeConfig } from '@/composables/usePageSwipe'
import { useTheme } from '@/composables/useTheme'
import { useViewport } from '@/composables/useViewport'
import artworkUrls from '@/data/artworks.json'

// --- Tuning knobs -----------------------------------------------------
// Roughly how many cards cover the screen, from ~25 on phones up to ~45
// on desktops (including the cropped ones hanging past the edges). Card
// size is derived from this, so density stays predictable per device
// (the solver deviates a little to keep the overflow symmetric).
const targetCardCount = (vw: number) => clamp(25, vw / 32, 45)
// Overall card size multiplier on top of that (bigger cards → fewer).
const CARD_SCALE = 0.9
// Space between cards.
const cardGap = (vw: number) => clamp(8, vw * 0.012, 16)
// Cards are 4:5 portrait.
const CARD_RATIO = 5 / 4
// Target overhang past each viewport edge, as a fraction of card width.
const BLEED_FRACTION = 0.5
// Blink knobs live in useBlink.ts; tune them live on the /dev route.
// ----------------------------------------------------------------------

const clamp = (min: number, value: number, max: number) => Math.min(Math.max(min, value), max)
const clamp01 = (value: number) => Math.min(Math.max(0, value), 1)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const viewport = useViewport()

// Swipe-down transition from the gallery (home) to the menu page. A single
// progress timeline (0 = home, 1 = menu) drives three overlapping moves:
// the grid slides up (phase A), the cards fade out, and the logo + nav
// travel to their menu positions (phase B).
const { progress, page, goTo } = usePageSwipe()

// Phase A: grid slide-up, done by phaseAEnd.
const eA = computed(() => easeInOutCubic(clamp01(progress.value / swipeConfig.phaseAEnd)))
// Phase B: logo/nav movement, from phaseBStart to the end.
const pB = computed(() => clamp01((progress.value - swipeConfig.phaseBStart) / (1 - swipeConfig.phaseBStart)))
// Card fade window (roots only; the logo never fades).
const cardsAlpha = computed(() =>
  1 - clamp01((progress.value - swipeConfig.fadeStart) / (swipeConfig.fadeEnd - swipeConfig.fadeStart)),
)

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

// The grid renders small cells, so it uses the pre-generated thumbnails
// (npm run generate:thumbs) instead of the full-size artworks.
const thumbUrl = (url: string) => '/Thumbs' + url

type CellItem = { type: 'art'; id: string; src: string } | { type: 'location'; id: string; name: string }

const ALL_ITEMS: CellItem[] = [
  ...artworkUrls.map((url) => ({ type: 'art' as const, id: url, src: thumbUrl(url) })),
  { type: 'location' as const, id: 'loc-Ankara', name: 'Ankara' },
  { type: 'location' as const, id: 'loc-Rotterdam', name: 'Rotterdam' },
  { type: 'location' as const, id: 'loc-Porto', name: 'Porto' },
]

// Deal items from a reshuffled deck so repeats stay spread out.
let deck: CellItem[] = []
const draw = (excludeItems: CellItem[] = [], allowLocation: boolean = true): CellItem => {
  const excludeIds = new Set(excludeItems.map((it) => it.id))

  for (let attempt = 0; attempt < 2; attempt++) {
    for (let i = deck.length - 1; i >= 0; i--) {
      const item = deck[i]!
      if (!excludeIds.has(item.id)) {
        if (!allowLocation && item.type === 'location') continue
        deck.splice(i, 1)
        return item
      }
    }
    const available = ALL_ITEMS.filter((it) => !excludeIds.has(it.id))
    deck = shuffle(available)
  }

  const fallbackArts = ALL_ITEMS.filter((it) => it.type === 'art')
  return fallbackArts[Math.floor(Math.random() * fallbackArts.length)]!
}

const { theme } = useTheme()
const logoVariant = computed(() => (theme.value === 'dark' ? 'black' : 'white'))

// The grid overfills the viewport and is centered, so the excess bleeds
// off the edges. For a given column/row count there is exactly one card
// width where that overhang is identical on all four sides — try counts
// near the target card size and keep the solution closest to it.
const metrics = computed(() => {
  const { width: vw, height: vh } = viewport.value
  const gap = cardGap(vw)
  const n = targetCardCount(vw)
  // Card width w where ~n cards tile the viewport plus its bleed ring:
  // ratio·n·w² ≈ (vw + w)(vh + ratio·w), solved as a quadratic in w.
  // Sizing by viewport area alone undercounts the ring, which on tall
  // narrow screens is over half the cards.
  const a = CARD_RATIO * (n - 1)
  const b = CARD_RATIO * vw + vh
  const targetW = (CARD_SCALE * (b + Math.sqrt(b * b + 4 * a * vw * vh))) / (2 * a)
  const targetBleed = targetW * BLEED_FRACTION

  const estCols = Math.round((vw + 2 * targetBleed + gap) / (targetW + gap))
  const estRows = Math.round((vh + 2 * targetBleed + gap) / (targetW * CARD_RATIO + gap))
  // CARD_SCALE shrinks/grows cards, which inversely changes how many fit.
  const targetCount = n / CARD_SCALE ** 2

  let best: { cardW: number; cols: number; rows: number } | null = null
  let bestScore = Infinity
  for (let cols = estCols - 2; cols <= estCols + 2; cols++) {
    for (let rows = estRows - 2; rows <= estRows + 2; rows++) {
      // Need at least a cropped edge ring plus the 2×2 logo block inside it.
      if (cols < 4 || rows < 4) continue
      // Solve vw = cols·w + (cols−1)·gap − 2·bleed and the same equation
      // vertically (with height rows·w·ratio) for w and bleed.
      const denom = CARD_RATIO * rows - cols
      if (Math.abs(denom) < 0.25) continue
      const cardW = (vh - vw - (rows - cols) * gap) / denom
      if (cardW < targetW * 0.5 || cardW > targetW * 1.6) continue
      const bleed = (cols * cardW + (cols - 1) * gap - vw) / 2
      // Every edge card must be genuinely cropped but still partly visible.
      if (bleed < 8 || bleed > cardW * 0.9) continue
      const score =
        Math.abs(cardW - targetW) / targetW +
        0.5 * Math.abs(bleed / cardW - BLEED_FRACTION) +
        0.5 * (Math.abs(cols * rows - targetCount) / targetCount)
      if (score < bestScore) {
        bestScore = score
        best = { cardW, cols, rows }
      }
    }
  }

  const solved = best ?? {
    // No exact solution nearby (extreme viewports): overfill and center,
    // which is symmetric per axis but not across axes.
    cardW: targetW,
    cols: Math.max(4, Math.ceil(vw / (targetW + gap)) + 1),
    rows: Math.max(4, Math.ceil(vh / (targetW * CARD_RATIO + gap)) + 1),
  }

  // Derive the overhang past each edge from the total grid size, so it is
  // correct in both branches (the solver's internal bleed is horizontal
  // only, and the fallback is asymmetric across axes).
  const { cardW, cols, rows } = solved
  const gridW = cols * cardW + (cols - 1) * gap
  const gridH = rows * cardW * CARD_RATIO + (rows - 1) * gap
  return {
    cardW,
    cols,
    rows,
    gap,
    bleedX: (gridW - vw) / 2,
    bleedY: (gridH - vh) / 2,
  }
})

// On phones the logo block sits in the middle of the screen; on larger
// screens it anchors top-left, one cell in from the cropped edge ring.
// Both stay on fully visible interior cells (cols/rows are at least 4).
const logoOrigin = computed(() => {
  const { cols, rows } = metrics.value
  const centered = viewport.value.width < 640
  return {
    col: centered ? 1 + Math.floor((cols - 4) / 2) : 1,
    row: centered ? 1 + Math.floor((rows - 4) / 2) : 1,
  }
})

const logoStyle = computed(() => {
  const { col, row } = logoOrigin.value
  const base = { gridColumn: `${col + 1} / span 2`, gridRow: `${row + 1} / span 2` }

  const eAv = eA.value
  const eB = easeInOutCubic(pB.value)
  if (eAv <= 0 && eB <= 0) return base

  const { cardW, gap, bleedX, bleedY } = metrics.value
  const cardH = cardW * CARD_RATIO
  const m = swipeConfig.logoMargin
  // On mobile/tablet the logo rests closer to the left edge.
  const small = viewport.value.width <= swipeConfig.logoSmallMaxWidth
  const mLeft = small ? swipeConfig.logoMarginLeft : m
  // Slide the wordmark within its card toward the left edge as it settles,
  // trimming the padding left by the centered rotated logo. Proportional to
  // the block width so it holds across screen sizes. clip via overflow.
  const logoShiftPx = small ? -eB * swipeConfig.logoShift * (2 * cardW + gap) : 0
  // Logo's resting (home) position in viewport coordinates.
  const x0 = -bleedX + col * (cardW + gap)
  const y0 = -bleedY + row * (cardH + gap)
  // The logo lives inside the grid, so phase A drags it up by bleedY·eA.
  // Add that back here so the grid slide never moves the logo; its net
  // travel is then a single straight diagonal from (x0, y0) to the corner
  // (mLeft, m), driven by eB on both axes — not a vertical step followed by
  // a diagonal one. Endpoint check at progress 1: the grid contributes
  // −bleedY, this adds +bleedY, leaving exactly (mLeft, m).
  const dx = eB * (mLeft - x0)
  const dy = eB * (m - y0) + bleedY * eAv
  return {
    ...base,
    transform: `translate3d(${dx}px, ${dy}px, 0)`,
    willChange: 'transform',
    zIndex: 2,
    '--logo-shift': `${logoShiftPx}px`,
  }
})

// Every non-logo cell holds an explicitly placed card.
const cellPositions = computed(() => {
  const { cols, rows } = metrics.value
  const { col: lc, row: lr } = logoOrigin.value
  const cells: { col: number; row: number; isEdge: boolean }[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const inLogo = col >= lc && col <= lc + 1 && row >= lr && row <= lr + 1
      if (!inLogo) {
        const isEdge = col === 0 || col === cols - 1 || row === 0 || row === rows - 1
        cells.push({ col, row, isEdge })
      }
    }
  }
  return cells
})

const artStyles = computed(() =>
  cellPositions.value.map(({ col, row }) => ({
    gridColumn: `${col + 1}`,
    gridRow: `${row + 1}`,
  })),
)

// Each cell holds its own item, re-dealt while it is faded out so
// a relit cell shows a different item; resizing only adds/removes.
const cellItems = ref<CellItem[]>([])
watch(cellPositions, (positions) => {
  const next = [...cellItems.value]
  
  // If a resize shifted a location card onto an edge cell, swap it for an art card
  for (let i = 0; i < Math.min(next.length, positions.length); i++) {
    if (positions[i]!.isEdge && next[i]!.type === 'location') {
      next[i] = draw(next, false)
    }
  }
  
  // Truncate or expand to match new cell count
  if (next.length > positions.length) {
    next.length = positions.length
  } else {
    while (next.length < positions.length) {
      next.push(draw(next, !positions[next.length]!.isEdge))
    }
  }
  cellItems.value = next
}, { immediate: true })

// Cells blink at random, weighted so those near the logo light up more.
const blinkWeights = computed(() => {
  // On the menu page the cards are faded out; stop blinking so it doesn't
  // churn image swaps behind the scenes. Resumes on return to home.
  if (page.value === 'menu') return cellPositions.value.map(() => 0)
  const { col: lc, row: lr } = logoOrigin.value
  return cellPositions.value.map(({ col, row }) => {
    const d = Math.hypot(col + 0.5 - (lc + 1), row + 0.5 - (lr + 1))
    return 1 / (1 + d) ** blinkConfig.distanceFalloff
  })
})

const lit = useBlink(blinkWeights)
const { trail, enter: trailEnter, leave: trailLeave } = useHoverTrail()

// When a cell goes dark, sometimes swap in a fresh item once the
// fade-out has finished, so the change itself is never visible.
// Images are fetched and decoded off-screen first.
const visibleCells = computed(() => new Set([...lit.value, ...trail.value]))
watch(visibleCells, (now, prev) => {
  for (const i of prev) {
    if (now.has(i) || Math.random() > blinkConfig.swapChance) continue
    window.setTimeout(() => {
      if (visibleCells.value.has(i) || i >= cellItems.value.length) return
      const isEdge = cellPositions.value[i]!.isEdge
      const item = draw(cellItems.value, !isEdge)
      const assign = () => {
        if (visibleCells.value.has(i) || i >= cellItems.value.length) return
        const next = [...cellItems.value]
        next[i] = item
        cellItems.value = next
      }
      if (item.type === 'art') {
        const img = new Image()
        img.src = item.src
        img.decode().then(assign, assign)
      } else {
        assign()
      }
    }, blinkConfig.fadeMs + 100)
  }
})

const showDevPanel = useRoute().name === 'dev'

const gridStyle = computed(() => ({
  '--cols': metrics.value.cols,
  '--rows': metrics.value.rows,
  '--card-w': `${metrics.value.cardW}px`,
  '--gap': `${metrics.value.gap}px`,
  '--blink-fade': `${blinkConfig.fadeMs}ms`,
  '--cards-alpha': cardsAlpha.value,
  transform: `translate3d(0, ${-metrics.value.bleedY * eA.value}px, 0)`,
  willChange: 'transform',
}))
</script>

<template>
  <main class="landing">
    <div class="grid" :class="{ 'menu-active': progress > 0 }" :style="gridStyle">
      <LogoCard :style="logoStyle" :variant="logoVariant" />
      <template v-for="(item, i) in cellItems" :key="i">
        <ArtCard
          v-if="item.type === 'art'"
          :src="item.src"
          :visible="lit.has(i) || trail.has(i)"
          :style="artStyles[i]"
          @mouseenter="trailEnter(i)"
          @mouseleave="trailLeave(i)"
        />
        <LocationCard
          v-else
          :name="item.name"
          :visible="lit.has(i) || trail.has(i)"
          :style="artStyles[i]"
          @mouseenter="trailEnter(i)"
          @mouseleave="trailLeave(i)"
        />
      </template>
    </div>
    <CollageCards :progress="pB" :active="page === 'menu'" />
    <SiteNav :progress="pB" :active="page === 'menu'" />
    <BlinkDevPanel v-if="showDevPanel" />
    <SwipeDevPanel v-if="showDevPanel" :page="page" @go="goTo" />
  </main>
</template>

<style scoped>
.landing {
  position: fixed;
  inset: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
  /* The grid track overflows the viewport; center it so the excess
     hangs off all sides equally instead of only right/bottom. */
  place-content: center;
  /* Own vertical gestures so the browser doesn't scroll/pull-to-refresh. */
  touch-action: none;
  overscroll-behavior: none;
}

.grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--card-w));
  grid-template-rows: repeat(var(--rows), calc(var(--card-w) * 5 / 4));
  gap: var(--gap);
}

/* Cards fade out as the page transitions to the menu (progress-driven, so
   no transition here). This multiplies with each card's own blink fade,
   which lives on the inner img/.inner element, and never touches the logo. */
.grid :deep(.art-card),
.grid :deep(.location-card) {
  opacity: var(--cards-alpha, 1);
}

/* On the menu page the cards are inert; this also silences their hover-trail
   mouseenter/leave handlers without any JS gating. */
.grid.menu-active :deep(.art-card),
.grid.menu-active :deep(.location-card) {
  pointer-events: none;
}
</style>
