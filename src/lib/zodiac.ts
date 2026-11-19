import type { ComputedRef, InjectionKey } from 'vue'

/**
 * Which zodiac the longitudes of a response are measured in: the name of the ayanamsha
 * applied, or null for tropical. A result panel provides it to the degree values it holds.
 */
export const APPLIED_AYANAMSHA: InjectionKey<ComputedRef<string | null>> = Symbol('appliedAyanamsha')

/**
 * The name an ayanamsha is shown by: the API's name with underscores as spaces, e.g.
 * `true citra`. The short keys (`tc`) are for requests only and are never shown.
 */
export function ayanamshaLabel(name: string | null | undefined): string {
  return (name ?? '').replace(/_/g, ' ').trim()
}

/** The ayanamshas listed first, in this order; the rest follow in the API's order. */
export const LEADING_AYANAMSHAS = ['tc', 'lh', 'kr']

/** A list of ayanamshas with the leading three at the top and the others in their own order. */
export function orderAyanamshas<T extends { key?: string | null }>(list: T[]): T[] {
  const rank = (item: T) => {
    const at = LEADING_AYANAMSHAS.indexOf(item.key ?? '')
    return at < 0 ? LEADING_AYANAMSHAS.length : at
  }
  // The sort is stable, so entries of equal rank keep their order.
  return [...list].sort((a, b) => rank(a) - rank(b))
}

interface Named {
  key?: string
  name?: string
}

/**
 * Reads the display name of the applied ayanamsha out of a response of any endpoint.
 * `nameOf` turns a key into the API's name where the response gives only the key.
 *
 * - `sidereal: true` with `ayanamshas: [...]`: the first listed is the one applied.
 * - `ayanamsha: { name }`, unless `sidereal` is false: longitudes are sidereal by it.
 * - `sidereal: "<key>"`: the key of the one applied.
 *
 * An ayanamsha that is only listed, with `sidereal` false, leaves the longitudes tropical.
 */
export function appliedAyanamsha(data: unknown, nameOf: (key: string) => string = (key) => key): string | null {
  return ayanamshaLabel(appliedAyanamshaName(data, nameOf)) || null
}

function appliedAyanamshaName(data: unknown, nameOf: (key: string) => string): string | null {
  if (!data || typeof data !== 'object') return null
  const res = data as { sidereal?: unknown; ayanamshas?: unknown; ayanamsha?: unknown }
  if (typeof res.sidereal === 'string' && res.sidereal) return nameOf(res.sidereal)
  if (res.sidereal === true && Array.isArray(res.ayanamshas) && res.ayanamshas.length) {
    const first = res.ayanamshas[0] as Named
    return first.name ?? (first.key ? nameOf(first.key) : null)
  }
  if (res.sidereal !== false && res.ayanamsha && typeof res.ayanamsha === 'object') {
    const one = res.ayanamsha as Named
    return one.name ?? (one.key ? nameOf(one.key) : null)
  }
  return null
}
