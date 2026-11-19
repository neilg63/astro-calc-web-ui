import { computed, ref } from 'vue'
import { formatUtcOffset } from '../api/geotz'
import { currentPlace, usePreferencesStore } from '../stores/preferences'
import type { JdDisplayMode } from './format'

/**
 * How result tables show their times: UTC, local clock time at the stored location's offset,
 * or Julian Day. One choice for the whole app, kept in the preferences.
 */

/** How many times are on screen that follow the shared choice; the selector shows when any are. */
export const shownTimes = ref(0)

export function useTimeBasis() {
  const prefs = usePreferencesStore()
  /** Seconds east of UTC stored with the location, or null when none is known. */
  const offset = computed(() => (typeof prefs.tzOffset === 'number' && Number.isFinite(prefs.tzOffset) ? prefs.tzOffset : null))
  /** The choice in force: local time falls back to UTC while no offset is known. */
  const mode = computed<JdDisplayMode>(() => (prefs.times === 'local' && offset.value === null ? 'utc' : prefs.times))
  const offsetLabel = computed(() => (offset.value === null ? '' : formatUtcOffset(offset.value)))
  /** e.g. `Times are local: UTC +5h 30m (Mumbai, Maharashtra (IN))`. */
  const note = computed(() => {
    if (mode.value === 'jd') return 'Times are Julian Days (UT)'
    if (mode.value === 'utc') return 'Times are UTC'
    const place = currentPlace(prefs)
    return `Times are local: ${offsetLabel.value}${place ? ` (${place.text})` : ''}`
  })
  return { prefs, offset, mode, offsetLabel, note }
}
