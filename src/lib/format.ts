import type { Moment } from '../api/types'
import { julToDateTimeString } from './julian-date'

/** A value that may be an API moment (`{ jd, utc, unix }`) or a bare Julian Day. */
export type MomentLike = Moment | number | null | undefined

/** The Julian Day of a moment or a bare number; null when there is none. */
export function momentJd(value: MomentLike): number | null {
  const jd = typeof value === 'number' ? value : value?.jd
  return typeof jd === 'number' && Number.isFinite(jd) ? jd : null
}

/** A Julian Day (UT) as `YYYY-MM-DD hh:mm:ss` in UTC, rounded to the nearest second. */
export function jdToUtc(jd: number): string {
  return julToDateTimeString(jd) || `JD ${jd.toFixed(5)}`
}

/** A moment as `YYYY-MM-DD hh:mm:ss` in UTC; `—` when there is none. */
export function formatMoment(value: MomentLike): string {
  const jd = momentJd(value)
  return jd === null ? '—' : jdToUtc(jd)
}

export function round(value: number | null | undefined, places = 4): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(places)
}

/**
 * A length of time in days as `hh:mm:ss`, rounded to the nearest second: `21:11:09`. From a
 * day up, the whole days come first: `13d 04:25:41`. A negative span keeps its sign; `—`
 * when there is none.
 */
export function formatDuration(days: number | null | undefined): string {
  if (days === null || days === undefined || !Number.isFinite(days)) return '—'
  const total = Math.round(Math.abs(days) * 86_400)
  const pad = (n: number) => String(n).padStart(2, '0')
  const sign = days < 0 && total > 0 ? '-' : ''
  const wholeDays = Math.floor(total / 86_400)
  const clock = `${pad(Math.floor((total % 86_400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
  return `${sign}${wholeDays > 0 ? `${wholeDays}d ` : ''}${clock}`
}

/** The time between two Julian Days, as [`formatDuration`] gives it; `—` unless both are known. */
export function formatJdSpan(start: number | null | undefined, end: number | null | undefined): string {
  return start == null || end == null ? '—' : formatDuration(end - start)
}

export type JdDisplayMode = 'utc' | 'local' | 'jd'

/**
 * A Julian Day shown as UTC date-time, as clock time `tzOffset` seconds east of UTC, or as
 * the raw number; `—` when the event did not happen.
 */
export function formatJd(value: MomentLike, mode: JdDisplayMode = 'utc', tzOffset = 0): string {
  const jd = momentJd(value)
  if (jd === null) return '—'
  if (mode === 'jd') return jd.toFixed(5)
  return mode === 'local' ? julToDateTimeString(jd, tzOffset) || jdToUtc(jd) : jdToUtc(jd)
}

export interface CoordColumns {
  /** Field names of the two angles in a position, and of their speeds. */
  first: string
  second: string
  firstLabel: string
  secondLabel: string
  /** Ecliptic longitudes are shown by zodiac sign; other angles as plain degrees. */
  ecliptic: boolean
}

/** The fields a position carries for the coordinate system named in a response's `cs`. */
export function coordColumns(cs: string | null | undefined): CoordColumns {
  switch (cs) {
    case 'equatorial':
      return { first: 'ras', second: 'dcl', firstLabel: 'Right asc.', secondLabel: 'Declination', ecliptic: false }
    case 'horizontal':
      return { first: 'azi', second: 'alt', firstLabel: 'Azimuth', secondLabel: 'Altitude', ecliptic: false }
    default:
      return { first: 'lng', second: 'lat', firstLabel: 'Longitude', secondLabel: 'Latitude', ecliptic: true }
  }
}
