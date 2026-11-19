import { defineStore } from 'pinia'
import type { PerspectiveKey } from '../lib/perspectives'

const STORAGE_KEY = 'astro-calc-web-ui.preferences.v1'

export interface AspectDef {
  angle: number
  orb: number
}

/** The date-time last used in a form: "now", a date-time string (UTC) or a Julian Day. */
export interface MomentChoice {
  mode: 'now' | 'dt' | 'jd'
  /** `YYYY-MM-DDThh:mm:ss`, read as UTC. */
  dt: string
  jd: number
}

/** A place chosen from the place search, with the coordinates it set and its time zone. */
export interface PlaceChoice {
  /** Display name, e.g. `Dunfermline, Scotland (GB)`. */
  text: string
  /** IANA zone name, e.g. `Europe/London`. */
  zone: string
  lat: number
  lng: number
}

/** Coordinates that a place search writes to, with the place it last chose. */
export interface PlaceTarget {
  lat: number
  lng: number
  alt: number
  place: PlaceChoice | null
  /** Seconds east of UTC at this location for the form's moment; null when not known. */
  tzOffset: number | null
  /** Whether `tzOffset` was typed by hand, not taken from the place's time zone. */
  tzManual: boolean
}

/** The remembered place, as long as the coordinates are still the ones it set. */
export function currentPlace(target: PlaceTarget): PlaceChoice | null {
  const place = target.place
  return place && place.lat === target.lat && place.lng === target.lng ? place : null
}

/** The historic (source) moment and place of transposed points: typically a birth. */
export interface HistoricChoice {
  mode: 'dt' | 'jd'
  /** `YYYY-MM-DDThh:mm:ss`, read as UTC. */
  dt: string
  jd: number
  lat: number
  lng: number
  alt: number
  /** The place last chosen by name; it applies only while the coordinates are still its own. */
  place: PlaceChoice | null
  tzOffset: number | null
  tzManual: boolean
}

export interface PreferencesState {
  apiBase: string
  lat: number
  lng: number
  alt: number
  /** The place last chosen by name; it applies only while the coordinates are still its own. */
  place: PlaceChoice | null
  /** Seconds east of UTC at the location for the moment in the form; null when not known. */
  tzOffset: number | null
  /** Whether `tzOffset` was typed by hand, not taken from the place's time zone. */
  tzManual: boolean
  /** How result tables show times: UTC, local time at `tzOffset`, or Julian Day. */
  times: 'utc' | 'local' | 'jd'
  tzOffsetHours: number
  /** The date-time last used, shared by every page and kept between visits. */
  moment: MomentChoice
  /** The historic moment and place last used on the transposed pages. */
  historic: HistoricChoice
  cs: 'ecl' | 'equ' | 'hor'
  ps: PerspectiveKey
  /** Which set of defaults the stored preferences were made under: see `DEFAULTS_VERSION`. */
  defaultsVersion: number
  ayanamshas: string[]
  sidereal: boolean
  houseSystems: string[]
  aspects: AspectDef[]
  defaultOrb: number
}

/** 2: the default perspective became topocentric. */
const DEFAULTS_VERSION = 2

function defaults(): PreferencesState {
  return {
    apiBase: 'https://astrocalc.multifaceted.info',
    lat: 51.5074,
    lng: -0.1278,
    alt: 100,
    place: null,
    tzOffset: null,
    tzManual: false,
    times: 'utc',
    tzOffsetHours: 0,
    moment: { mode: 'now', dt: '', jd: 2451545.0 },
    historic: { mode: 'dt', dt: '2000-01-01T12:00:00', jd: 2451545.0, lat: 51.5074, lng: -0.1278, alt: 100, place: null, tzOffset: null, tzManual: false },
    cs: 'ecl',
    ps: 'topo',
    defaultsVersion: DEFAULTS_VERSION,
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
  state: (): PreferencesState => {
    const base = defaults()
    const saved = loadFromStorage()
    // Preferences stored under the old defaults hold the old default perspective, not a choice.
    if ((saved.defaultsVersion ?? 1) < 2 && saved.ps === 'geo') delete saved.ps
    saved.defaultsVersion = DEFAULTS_VERSION
    // `moment` and `historic` are merged field by field so that stored preferences from before they existed still load.
    return { ...base, ...saved, moment: { ...base.moment, ...(saved.moment ?? {}) }, historic: { ...base.historic, ...(saved.historic ?? {}) } }
  },
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
