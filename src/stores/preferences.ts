import { defineStore } from 'pinia'

const STORAGE_KEY = 'astro-calc-web-ui.preferences.v1'

export interface AspectDef {
  angle: number
  orb: number
}

export interface PreferencesState {
  apiBase: string
  lat: number
  lng: number
  alt: number
  tzOffsetHours: number
  cs: 'ecl' | 'equ' | 'hor'
  ps: 'geo' | 'topo'
  ayanamshas: string[]
  sidereal: boolean
  houseSystems: string[]
  aspects: AspectDef[]
  defaultOrb: number
}

function defaults(): PreferencesState {
  return {
    apiBase: 'https://astrocalc.multifaceted.info',
    lat: 51.5074,
    lng: -0.1278,
    alt: 100,
    tzOffsetHours: 0,
    cs: 'ecl',
    ps: 'geo',
    ayanamshas: [],
    sidereal: false,
    houseSystems: ['W'],
    aspects: [
      { angle: 0, orb: 8 },
      { angle: 180, orb: 8 },
      { angle: 90, orb: 8 },
      { angle: 120, orb: 8 },
      { angle: 150, orb: 3 },
      { angle: 60, orb: 6 },
    ],
    defaultOrb: 8,
  }
}

function loadFromStorage(): Partial<PreferencesState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<PreferencesState>) : {}
  } catch {
    return {}
  }
}

export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => ({ ...defaults(), ...loadFromStorage() }),
  getters: {
    /**
     * `lat,lng,alt` for the API. A cleared number box holds null, which must never reach the
     * query string: a blank altitude is left off, and without both a latitude and a longitude
     * there is no location at all (an empty string, which is dropped from the request).
     */
    loc(state): string {
      const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
      if (!isNumber(state.lat) || !isNumber(state.lng)) return ''
      return isNumber(state.alt) ? `${state.lat},${state.lng},${state.alt}` : `${state.lat},${state.lng}`
    },
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      } catch {
        // localStorage unavailable (private mode, quota) — preferences just won't persist.
      }
    },
    resetToDefaults() {
      this.$patch(defaults())
    },
  },
})

export function installPreferencesPersistence(store: ReturnType<typeof usePreferencesStore>) {
  store.$subscribe(() => store.persist())
}
