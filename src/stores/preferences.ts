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
    alt: 0,
    tzOffsetHours: 0,
    cs: 'ecl',
    ps: 'geo',
    ayanamshas: [],
    sidereal: false,
    houseSystems: ['W'],
    aspects: [
      { angle: 0, orb: 8 },
      { angle: 60, orb: 6 },
      { angle: 90, orb: 8 },
      { angle: 120, orb: 8 },
      { angle: 180, orb: 8 },
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
    loc(state): string {
      return `${state.lat},${state.lng},${state.alt}`
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
