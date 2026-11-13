export interface Moment {
  jd: number
  utc: string | null
  unix: number | null
}

export interface GeoJson {
  lat: number
  lng: number
  alt: number
}

export interface BodyRef {
  key: string
  name: string
  available: boolean
}

export interface StarRef {
  key: string
  name: string
  hip: number
  magnitude: number | null
}

export interface AyanamshaValue {
  key: string | null
  name: string
  value: number
}

export interface BodyPosition {
  key: string
  lng: number
  lat: number
  lng_speed: number
  lat_speed: number
  dist: number
  dist_speed: number
}

export interface IndexInfo {
  name: string
  version: string
  ephemeris_range: { from: Moment; to: Moment } | null
  station_table: boolean
  endpoints: string[]
}

export interface AspectTarget {
  angle: number
  orb: number
}

export interface AspectMatch {
  a: string
  b: string
  aspect: number
  orb: number
  divergence: number
  separation: number
}

export interface HouseSet {
  system: string
  name: string
  cusps: number[]
  fallback: string | null
}

export interface Angles {
  ascendant: number
  descendant: number
  mc: number
  ic: number
  armc: number
  vertex: number
  equasc: number
  coasc1: number
  coasc2: number
  polasc: number
}

export interface StationEntry {
  jd: number
  utc: string | null
  unix: number | null
  type: string
  speed: number
}

export interface StationsForBody {
  key: string
  speed: number
  retrograde: boolean
  stations: StationEntry[]
}

export interface DayTransitsForBody {
  key: string
  day_start: Moment
  prev_set: Moment | null
  rise: Moment | null
  mc: Moment | null
  set: Moment | null
  ic: Moment | null
  next_rise: Moment | null
  min_alt: number
  max_alt: number
}

export interface MoonPhaseEntry extends Moment {
  num: number
  phase: string
}

export interface PhenoEntry {
  key: string
  phase_angle: number
  illuminated: number
  elongation: number
  diameter: number
  magnitude: number | null
}
