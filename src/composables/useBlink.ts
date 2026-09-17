import { reactive, ref, onBeforeUnmount, type Ref } from 'vue'

// Tuning knobs, adjustable live from the /dev panel.
export const BLINK_DEFAULTS = {
  // Fraction of cells visible at any moment.
  litFraction: 0.25,
  // Each lit cell stays visible for a random duration in this range.
  minOnMs: 2000,
  maxOnMs: 4000,
  // Scheduler cadence; how quickly a faded-out cell gets replaced.
  // A short tick with one light per tick staggers fade starts so
  // several never begin on the same frame.
  tickMs: 100,
  // Cells lit per tick.
  maxLitPerTick: 1,
  // How strongly blinking concentrates near the logo (0 = uniform).
  distanceFalloff: 2,
  // Opacity fade duration.
  fadeMs: 1600,
  // Rest time after a blink (on top of the fade-out) before the same
  // cell can relight, so it never reverses mid-fade.
  cooldownMs: 3000,
  // How long hovered cells linger before fading out.
  trailMs: 2000,
  // Chance a cell is dealt a new artwork after fading out (1 = always).
  // Lower values reduce image loading/decoding churn.
  swapChance: 1,
  // How often a location card wanders to another cell (round-robin,
  // so each card moves every 3× this).
  locationMoveMs: 6000,
}

export const blinkConfig = reactive({ ...BLINK_DEFAULTS })

export function resetBlinkConfig() {
  Object.assign(blinkConfig, BLINK_DEFAULTS)
}

// Keeps ~litFraction of the cells "lit" at a time, picking replacements
// at random with the given per-cell weights (higher weight → lit more
// often). Weights and config are re-read every tick, so grid resizes
// and live tuning just work.
export function useBlink(weights: Ref<number[]>): Ref<ReadonlySet<number>> {
  const lit = ref<Set<number>>(new Set())
  const offTimers = new Set<number>()
  // Cells resting after a blink, mapped to when they may relight.
  const blockedUntil = new Map<number, number>()

  const pickable = (i: number, exclude: Set<number>): boolean => {
    if (exclude.has(i)) return false
    const until = blockedUntil.get(i)
    if (until === undefined) return true
    if (Date.now() < until) return false
    blockedUntil.delete(i)
    return true
  }

  const pickWeighted = (exclude: Set<number>): number => {
    let total = 0
    for (let i = 0; i < weights.value.length; i++) {
      if (pickable(i, exclude)) total += weights.value[i]!
    }
    if (total <= 0) return -1
    let r = Math.random() * total
    for (let i = 0; i < weights.value.length; i++) {
      if (!pickable(i, exclude)) continue
      r -= weights.value[i]!
      if (r <= 0) return i
    }
    return -1
  }

  const tick = () => {
    const count = weights.value.length
    const next = new Set([...lit.value].filter((i) => i < count))
    let changed = next.size !== lit.value.size
    const target = Math.max(1, Math.round(count * blinkConfig.litFraction))
    for (let n = 0; n < blinkConfig.maxLitPerTick && next.size < target; n++) {
      const i = pickWeighted(next)
      if (i < 0) break
      next.add(i)
      changed = true
      const range = Math.max(0, blinkConfig.maxOnMs - blinkConfig.minOnMs)
      const onMs = blinkConfig.minOnMs + Math.random() * range
      const t = window.setTimeout(() => {
        offTimers.delete(t)
        blockedUntil.set(i, Date.now() + blinkConfig.fadeMs + blinkConfig.cooldownMs)
        const pruned = new Set(lit.value)
        pruned.delete(i)
        lit.value = pruned
      }, onMs)
      offTimers.add(t)
    }
    if (changed) lit.value = next
  }

  // Self-rescheduling timeout instead of setInterval so tickMs is live.
  let tickTimer = 0
  const loop = () => {
    tick()
    tickTimer = window.setTimeout(loop, blinkConfig.tickMs)
  }
  tickTimer = window.setTimeout(loop, blinkConfig.tickMs)

  onBeforeUnmount(() => {
    window.clearTimeout(tickTimer)
    offTimers.forEach((t) => window.clearTimeout(t))
  })

  return lit
}
