import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'kasten-theme'

const stored = localStorage.getItem(STORAGE_KEY)
const initial: Theme =
  stored === 'light' || stored === 'dark'
    ? stored
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

const theme = ref<Theme>(initial)
apply(initial)

function apply(value: Theme) {
  document.documentElement.dataset.theme = value
}

function toggle() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  apply(theme.value)
  localStorage.setItem(STORAGE_KEY, theme.value)
}

export function useTheme() {
  return { theme, toggle }
}
