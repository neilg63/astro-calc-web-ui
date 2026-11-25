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

/** A tithi of `/tithis`: 1 to 30 from the new moon. */
export interface TithiInfo {
  num: number
  paksha: 'Shukla' | 'Krishna'
  /** The day within the paksha, 1 to 15. */
  day: number
  name: string
  /** The phase it begins at: `New` for the 1st, `Full` for the 16th. */
  phase: string | null
}

/** A karana of `/tithis`: 1 to 60 from the new moon, half a tithi. */
export interface KaranaInfo {
  num: number
  name: string
  tithi: number
  half: 1 | 2
  /** The phase it begins at, if any of the four. */
  phase: string | null
}

/** A tithi or a karana with the moment it begins. */
export type TithiEntry = Moment & TithiInfo
export type KaranaEntry = Moment & KaranaInfo

/** A body of `/nakshatra`: where its sidereal longitude falls among the 27 nakshatras. */
export interface NakshatraEntry {
  key: string
  /** Sidereal longitude. */
  lng: number
  /** 1 (Ashwini) to 27 (Revati). */
  num: number
  name: string
  pada: number
  /** The ruling body's key, in Vimshottari order. */
  lord: string
  /** Degrees into the nakshatra, and the same as a part of the whole. */
  degrees: number
  fraction: number
  /**
   * The moments the body came into the nakshatra and leaves it, as Julian Days. Null where
   * not found within the search; the ascendant has neither.
   */
  start_jd?: number | null
  end_jd?: number | null
}

/** An item of `/nakshatras`: a nakshatra a body passes through, and the moment it enters. */
export interface NakshatraStep {
  /** 1 (Ashwini) to 27 (Revati). */
  num: number
  name: string
  /** The ruling body's key, in Vimshottari order. */
  lord: string
  /** The moment the body enters it, as a Julian Day; null if not found for the one in force. */
  start_jd: number | null
  /** False where the body enters it moving backwards, at its end. */
  direct: boolean | null
}

export interface PhenoEntry {
  key: string
  phase_angle: number
  illuminated: number
  elongation: number
  diameter: number
  magnitude: number | null
}

export interface BodyLongitude {
  key: string
  lng: number
}

/** A position in all three coordinate systems (`cs=all`): ecliptic, equatorial and horizontal. */
export interface ExtendedBodyPosition extends BodyPosition {
  ras: number
  dcl: number
  /** Azimuth and altitude are null from a centre away from the Earth, where there is no horizon. */
  azi: number | null
  alt: number | null
  ras_speed: number
  dcl_speed: number
  azi_speed: number | null
  alt_speed: number | null
}

/** One local day of `/rise-sets`. Times are Julian Days (UT); `null` when the event does not happen that day. */
export interface RiseSetDay {
  day_start: number
  rise: number | null
  mc: number | null
  set: number | null
  ic: number | null
  alt_min: number
  alt_max: number
}

export interface RiseSetDaysForBody {
  key: string
  days: RiseSetDay[]
}

export interface RiseSetOptionsJson {
  disc: string
  refraction: boolean
  pressure: number | null
  temp: number | null
  fixed: boolean
  horizon: number | null
  twilight: string | null
  dip: boolean
  geocentric: boolean
  ignore_latitude: boolean
}

export interface BulkLabel {
  ref: string
  tags?: unknown
}

export interface BulkChart extends BulkLabel {
  date: Moment
  geo: GeoJson
  engine: string
  bodies: BodyPosition[]
}

export interface BulkAspectHit {
  a: string
  b: string
  lng_a: number
  lng_b: number
  aspect: number
  orb: number
  divergence: number
}

/** One-to-many matches carry the target's own `ref`; pairs and many-to-many carry `a` and `b`. */
export interface BulkMatch {
  ref?: string
  tags?: unknown
  a?: BulkLabel
  b?: BulkLabel
  closest: number
  aspects: BulkAspectHit[]
}

export interface BulkError {
  ref?: string | null
  index?: number
  error: string
}

/** A transposed point of `/transposed-positions`: `key` is `tp:` and the source body's key. */
export interface TransposedPosition extends ExtendedBodyPosition {
  source: string
}

export interface TransposedTransitsForBody {
  key: string
  source: string
  lng: number
  lat: number
  days: RiseSetDay[]
}

/** The head shared by the transposed endpoints. The points are given in the topocentric view only. */
export interface TransposedHead {
  date: Moment
  geo: GeoJson
  historic_date: Moment
  historic_geo: GeoJson | null
  ps: string
  points?: Angles
  historic_points?: Angles
}
