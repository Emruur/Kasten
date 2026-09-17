import { ref, onBeforeUnmount, type Ref } from 'vue'
import { blinkConfig } from './useBlink'

// Cells the pointer passes over stay visible for trailMs after it
// leaves, then fade out — the mouse paints a temporary trail of images.
export function useHoverTrail(): {
  trail: Ref<ReadonlySet<number>>
  enter: (i: number) => void
  leave: (i: number) => void
} {
  const trail = ref<Set<number>>(new Set())
  const timers = new Map<number, number>()

  const clearTimer = (i: number) => {
    const t = timers.get(i)
    if (t !== undefined) {
      window.clearTimeout(t)
      timers.delete(i)
    }
  }

  const enter = (i: number) => {
    clearTimer(i)
    if (!trail.value.has(i)) {
      const next = new Set(trail.value)
      next.add(i)
      trail.value = next
    }
  }

  const leave = (i: number) => {
    clearTimer(i)
    const t = window.setTimeout(() => {
      timers.delete(i)
      const next = new Set(trail.value)
      next.delete(i)
      trail.value = next
    }, blinkConfig.trailMs)
    timers.set(i, t)
  }

  onBeforeUnmount(() => timers.forEach((t) => window.clearTimeout(t)))

  return { trail, enter, leave }
}
