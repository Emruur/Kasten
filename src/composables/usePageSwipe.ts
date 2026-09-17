import { reactive, ref, onBeforeUnmount } from 'vue'

// Tuning knobs, adjustable live from the /dev panel. Fractions are
// positions along the 0→1 transition timeline; px values are distances.
export const SWIPE_DEFAULTS = {
  // Snap tween length.
  durationMs: 900,
  // Accumulated wheel deltaY needed to trigger a snap. Kept low so the
  // transition kicks off on a small flick rather than a long scroll.
  wheelThreshold: 60,
  // Idle gap that resets the wheel accumulator.
  wheelResetMs: 200,
  // After a snap completes, swallow input for this long so trackpad
  // momentum doesn't immediately re-trigger.
  settleMs: 500,
  // Touch drag (px) needed to trigger a snap.
  touchThreshold: 40,
  // The grid finishes sliding up by this point in the timeline.
  phaseAEnd: 0.5,
  // The logo/nav movement starts here (overlapping phase A).
  phaseBStart: 0.35,
  // Card fade-out window.
  fadeStart: 0.15,
  fadeEnd: 0.6,
  // Resting margin (px) between the logo and the top edge (and the left
  // edge on desktop).
  logoMargin: 24,
  // On small screens (mobile / tablet) the logo rests closer to the left
  // edge; this horizontal margin replaces logoMargin at/below the width
  // below. Vertical margin stays logoMargin.
  logoMarginLeft: 0,
  // Viewport width (px) at/below which logoMarginLeft applies (covers
  // phones and iPads; typical desktops are wider).
  logoSmallMaxWidth: 1200,
  // The wordmark is centered in its (wider) card, leaving side padding. On
  // small screens, slide it toward the left edge during the transition by
  // this fraction of the logo block width (~0.34 makes it flush; higher
  // pushes past any transparent padding baked into the logo image).
  logoShift: 0.3,
  // Nav anchor: distance from the right and bottom edges (px).
  navRight: 32,
  navBottom: 96,
  // Gap between nav items (px).
  navGap: 10,
  // How far each nav item slides in from the right (px).
  navSlide: 480,
  // Per-item stagger within phase B (fraction of the phase).
  navStagger: 0.08,
}

export const swipeConfig = reactive({ ...SWIPE_DEFAULTS })

export function resetSwipeConfig() {
  Object.assign(swipeConfig, SWIPE_DEFAULTS)
}

// Ease-out (not ease-in-out): the tween starts at full velocity so the
// motion is visible the instant the snap fires — no flat ramp-up that reads
// as lag — then decelerates smoothly into the resting state.
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function usePageSwipe() {
  const progress = ref(0)
  const page = ref<'home' | 'menu'>('home')
  const animating = ref(false)

  let rafId = 0
  let cooldownUntil = 0

  const goTo = (target: 0 | 1) => {
    if (rafId) cancelAnimationFrame(rafId)

    if (prefersReducedMotion() || swipeConfig.durationMs <= 0) {
      progress.value = target
      page.value = target === 1 ? 'menu' : 'home'
      animating.value = false
      cooldownUntil = performance.now() + swipeConfig.settleMs
      return
    }

    const from = progress.value
    const delta = target - from
    if (delta === 0) {
      page.value = target === 1 ? 'menu' : 'home'
      return
    }
    const start = performance.now()
    animating.value = true

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / swipeConfig.durationMs)
      progress.value = from + delta * easeOutCubic(t)
      if (t < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        rafId = 0
        progress.value = target
        page.value = target === 1 ? 'menu' : 'home'
        animating.value = false
        cooldownUntil = performance.now() + swipeConfig.settleMs
      }
    }
    rafId = requestAnimationFrame(step)
  }

  // --- Wheel input ------------------------------------------------------
  let acc = 0
  let lastWheelAt = 0

  const onWheel = (e: WheelEvent) => {
    if (animating.value || performance.now() < cooldownUntil) return
    // Let the dev panel's own scrollable controls work without snapping.
    if (e.target instanceof Element && e.target.closest('.dev-panel')) return

    const now = performance.now()
    if (now - lastWheelAt > swipeConfig.wheelResetMs || Math.sign(e.deltaY) !== Math.sign(acc)) {
      acc = 0
    }
    lastWheelAt = now
    acc += e.deltaY

    if (page.value === 'home' && acc > swipeConfig.wheelThreshold) {
      acc = 0
      goTo(1)
    } else if (page.value === 'menu' && acc < -swipeConfig.wheelThreshold) {
      acc = 0
      goTo(0)
    }
  }

  // --- Touch input ------------------------------------------------------
  let touchStartY = 0
  let touchFired = false

  const onTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0]?.clientY ?? 0
    touchFired = false
  }

  const onTouchMove = (e: TouchEvent) => {
    if (touchFired || animating.value || performance.now() < cooldownUntil) return
    if (e.target instanceof Element && e.target.closest('.dev-panel')) return
    // Prevent the browser's pull-to-refresh / rubber-band while swiping.
    e.preventDefault()

    // Swiping the finger up (positive delta) reveals the page below.
    const delta = touchStartY - (e.touches[0]?.clientY ?? touchStartY)
    if (page.value === 'home' && delta > swipeConfig.touchThreshold) {
      touchFired = true
      goTo(1)
    } else if (page.value === 'menu' && delta < -swipeConfig.touchThreshold) {
      touchFired = true
      goTo(0)
    }
  }

  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
  })

  return { progress, page, animating, goTo }
}
