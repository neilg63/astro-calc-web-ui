import { computed, ref, watchEffect } from 'vue'
import { usePreferencesStore } from '../stores/preferences'

/** The colour scheme in force. */
export type Theme = 'light' | 'dark'

const systemQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
/** Whether the system or browser asks for a dark scheme. */
const systemDark = ref(systemQuery?.matches ?? false)
systemQuery?.addEventListener('change', (event) => {
  systemDark.value = event.matches
})

/**
 * The colour scheme: the stored preference, or the system's while none has been chosen.
 * `toggle` chooses the other one, which is then remembered.
 */
export function useTheme() {
  const prefs = usePreferencesStore()
  const theme = computed<Theme>(() => (prefs.theme === 'system' ? (systemDark.value ? 'dark' : 'light') : prefs.theme))
  function toggle() {
    prefs.theme = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggle }
}

/**
 * Keeps `data-theme` on the root element in step with the scheme in force. Bulma, Buefy and
 * the app's own colours (`global.css`) all read it.
 */
export function installTheme() {
  const { theme } = useTheme()
  watchEffect(() => {
    document.documentElement.dataset.theme = theme.value
  })
}
