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
 * A fraction on the API's 0.0 to 1.0 scale as a percentage: `0.1305` is `13.05%`. `—` when
 * there is none.
 */
export function formatPercent(fraction: number | null | undefined, places = 2): string {
  if (fraction === null || fraction === undefined || !Number.isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(places)}%`
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

/**
 * A length of time in days spelt out in hours, minutes and seconds, leaving out any part
 * that is zero: `48 minutes`, `24 minutes 2 seconds`, `24 seconds`, `0.4 seconds`. Seconds
 * are whole from ten up and to one decimal below that. With `short`, the units are letters:
 * `48m`, `23m 59s`, `24s`, `0.4s`. `—` when there is none.
 */
export function formatDurationWords(days: number | null | undefined, short = false): string {
  if (days === null || days === undefined || !Number.isFinite(days)) return '—'
  const exact = Math.abs(days) * 86_400
  const total = exact < 10 ? Math.round(exact * 10) / 10 : Math.round(exact)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = Math.round((total % 60) * 10) / 10
  const part = (n: number, unit: string) => (short ? `${n}${unit[0]}` : `${n} ${unit}${n === 1 ? '' : 's'}`)
  const parts = [
    hours > 0 ? part(hours, 'hour') : '',
    minutes > 0 ? part(minutes, 'minute') : '',
    seconds > 0 || total === 0 ? part(seconds, 'second') : '',
  ].filter(Boolean)
  return `${days < 0 && total > 0 ? '-' : ''}${parts.join(' ')}`
}
