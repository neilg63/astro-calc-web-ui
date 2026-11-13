import type { Moment } from '../api/types'

export function formatMoment(m: Moment | null | undefined): string {
  if (!m) return '—'
  return m.utc ?? (m.jd != null ? `JD ${m.jd.toFixed(5)}` : '—')
}

export function round(value: number | null | undefined, places = 4): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(places)
}
