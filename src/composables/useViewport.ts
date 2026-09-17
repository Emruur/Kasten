import { ref, onBeforeUnmount, type Ref } from 'vue'

export interface ViewportSize {
  width: number
  height: number
}

export function useViewport(): Ref<ViewportSize> {
  const size = ref<ViewportSize>({ width: window.innerWidth, height: window.innerHeight })

  const update = () => {
    size.value = { width: window.innerWidth, height: window.innerHeight }
  }
  window.addEventListener('resize', update)
  onBeforeUnmount(() => window.removeEventListener('resize', update))

  return size
}
