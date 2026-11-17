import { reactive } from 'vue'
import type { AspectDef, MomentChoice } from '../stores/preferences'
import { usePreferencesStore } from '../stores/preferences'
import { perspective, type PerspectiveKey } from './perspectives'

/** Serializes aspect definitions into the API's `angle:orb,angle:orb` form. */
export function aspectsParam(defs: AspectDef[]): string {
  // A cleared orb box holds null: send the angle alone and the API applies its default orb.
  return defs
    .filter((d) => Number.isFinite(d.angle))
    .map((d) => (Number.isFinite(d.orb) ? `${d.angle}:${d.orb}` : `${d.angle}`))
    .join(',')
}

/** "Now", a date-time (read as UTC) or a Julian Day. */
export type MomentForm = MomentChoice

/**
 * The date-time form shared by every page. It lives in the preferences store, so the last
 * date-time entered is still there on the next page and on the next visit.
 */
export function useMomentForm(): MomentForm {
  return usePreferencesStore().moment
}

export function momentParams(form: MomentForm): Record<string, unknown> {
  switch (form.mode) {
    case 'jd':
      return { jd: form.jd }
    case 'dt':
      // No offset is sent: the API reads `dt` as UTC.
      return { dt: form.dt }
    default:
      return {}
  }
}

/** A second moment, for range-based endpoints (`stations`, `moon-phases`). */
export interface RangeEndForm {
  mode: 'none' | 'dt2' | 'jd2' | 'days'
  dt2: string
  jd2: number
  days: number
}

export function useRangeEndForm(): RangeEndForm {
  return reactive({ mode: 'none', dt2: '', jd2: 2451545.0, days: 30 })
}

export function rangeEndParams(form: RangeEndForm): Record<string, unknown> {
  switch (form.mode) {
    case 'dt2':
      return { dt2: form.dt2 }
    case 'jd2':
      return { jd2: form.jd2 }
    case 'days':
      return { days: form.days }
    default:
      return {}
  }
}

export interface ViewForm {
  useLocation: boolean
  cs: 'ecl' | 'equ' | 'hor'
  ps: PerspectiveKey
}

export function useViewForm(): ViewForm {
  const prefs = usePreferencesStore()
  return reactive({ useLocation: true, cs: prefs.cs, ps: prefs.ps })
}

export function viewParams(form: ViewForm): Record<string, unknown> {
  return {
    cs: form.cs,
    ps: form.ps,
    loc: viewLocation(form),
  }
}

/**
 * The location to send with a view: always for a perspective on the Earth's surface, by
 * choice for the geocentric one, and never for a centre away from the Earth.
 */
export function viewLocation(form: ViewForm, required = false): string | undefined {
  const prefs = usePreferencesStore()
  const ps = perspective(form.ps)
  return required || ps.needsLocation || (ps.earth && form.useLocation) ? prefs.loc : undefined
}
