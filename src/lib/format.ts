import type { Moment } from '../api/types'

export function formatMoment(m: Moment | null | undefined): string {
  if (!m) return '—'
  return m.utc ?? (m.jd != null ? `JD ${m.jd.toFixed(5)}` : '—')
}

export function round(value: number | null | undefined, places = 4): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(places)
}

const JD_UNIX_EPOCH = 2440587.5
const MS_PER_DAY = 86_400_000

/** A Julian Day (UT) as `YYYY-MM-DD HH:mm:ss` in UTC, rounded to the nearest second. */
export function jdToUtc(jd: number): string {
  const ms = Math.round(((jd - JD_UNIX_EPOCH) * MS_PER_DAY) / 1000) * 1000
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return `JD ${jd.toFixed(5)}`
  return date.toISOString().replace('T', ' ').replace('.000Z', '')
}

export type JdDisplayMode = 'utc' | 'jd'

/** A Julian Day shown as UTC date-time or as the raw number; `—` when the event did not happen. */
export function formatJd(jd: number | null | undefined, mode: JdDisplayMode = 'utc'): string {
  if (jd === null || jd === undefined || Number.isNaN(jd)) return '—'
  return mode === 'jd' ? jd.toFixed(5) : jdToUtc(jd)
}
