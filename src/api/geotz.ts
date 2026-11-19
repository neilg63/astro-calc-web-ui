import axios from 'axios'
import { cleanParams } from './client'

/**
 * Client for the GeoTimeZone service: place-name suggestions with their time zones, and the
 * offset in force in a zone at a given moment. See https://github.com/neilg63/geotz-api.
 */
export const GEOTZ_BASE = import.meta.env.VITE_GEOTZ_BASE ?? 'https://geotz.multifaceted.info'

const client = axios.create({ baseURL: GEOTZ_BASE, timeout: 10_000 })

/** One suggestion from `/lookup`. */
export interface PlaceMatch {
  id: number
  lat: number
  lng: number
  /** Display name, e.g. `Dunfermline, Scotland (GB)`. */
  text: string
  /** IANA zone name, e.g. `Europe/London`. */
  zone_name: string
}

/** The part of the `/timezone` response the app uses. */
export interface ZoneInfo {
  zone_name: string
  abbreviation: string
  /** Seconds east of UTC at the reference time. */
  gmt_offset: number
  dst: boolean
  /** The reference time on local clocks, `YYYY-MM-DDThh:mm:ss`. */
  local_dt: string
  utc: string
}

/**
 * The reference time of a zone query: a UTC date-time, a clock time in the zone (`dtl`),
 * a Julian Day, or none of them for now.
 */
export interface ZoneMoment {
  dt?: string
  dtl?: string
  jd?: number
}

/** Shortest query the service accepts. */
export const MIN_PLACE_QUERY = 2

/** Places whose names begin with the words typed, best match first. */
export async function lookupPlaces(q: string, signal?: AbortSignal, max = 12): Promise<PlaceMatch[]> {
  const res = await client.get<PlaceMatch[]>('/lookup', { params: { q, max }, signal })
  return Array.isArray(res.data) ? res.data : []
}

const zoneCache = new Map<string, Promise<ZoneInfo>>()
const ZONE_CACHE_LIMIT = 200

/**
 * The offset and local time in a zone at a moment (now when none is given). Answers for a
 * stated moment never change, so they are kept and shared between the components that ask.
 */
export async function fetchZoneInfo(zone: string, moment: ZoneMoment = {}, signal?: AbortSignal): Promise<ZoneInfo> {
  const params = cleanParams({ zn: zone, ...moment })
  const timed = Object.keys(params).length > 1
  const key = JSON.stringify(params)
  const kept = timed ? zoneCache.get(key) : undefined
  if (kept) return kept
  // A shared request is not tied to one caller's abort signal.
  const request = client.get<ZoneInfo>('/timezone', { params, signal: timed ? undefined : signal }).then((res) => res.data)
  if (timed) {
    if (zoneCache.size >= ZONE_CACHE_LIMIT) zoneCache.clear()
    zoneCache.set(key, request)
    request.catch(() => zoneCache.delete(key))
  }
  return request
}

/** Seconds east of UTC as `UTC +1h`, `UTC -5h` or `UTC +5h 30m`. */
export function formatUtcOffset(seconds: number): string {
  if (!Number.isFinite(seconds)) return ''
  const minutes = Math.round(Math.abs(seconds) / 60)
  const rest = minutes % 60
  return `UTC ${seconds < 0 ? '-' : '+'}${Math.floor(minutes / 60)}h${rest ? ` ${rest}m` : ''}`
}

/** Seconds east of UTC as signed clock time: `+01:00`, `-05:00`, `+05:45`. */
export function formatOffsetClock(seconds: number): string {
  if (!Number.isFinite(seconds)) return ''
  const minutes = Math.round(Math.abs(seconds) / 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${seconds < 0 ? '-' : '+'}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

/**
 * Reads an offset typed as `+1`, `-5`, `5:30`, `+05:45` or `-0330` into seconds east of UTC.
 * Null when it is not an offset of at most 15 hours.
 */
export function parseOffsetClock(text: string): number | null {
  const match = /^\s*([+\-−])?\s*(\d{1,2})(?::?(\d{2}))?\s*$/.exec(text)
  if (!match) return null
  const hours = Number(match[2])
  const minutes = Number(match[3] ?? 0)
  if (hours > 15 || minutes > 59) return null
  const seconds = hours * 3600 + minutes * 60
  return match[1] && match[1] !== '+' ? -seconds : seconds
}
