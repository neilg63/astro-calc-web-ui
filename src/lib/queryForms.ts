import { reactive } from 'vue'
import type { AspectDef } from '../stores/preferences'
import { usePreferencesStore } from '../stores/preferences'

/** Serializes aspect definitions into the API's `angle:orb,angle:orb` form. */
export function aspectsParam(defs: AspectDef[]): string {
  return defs.map((d) => `${d.angle}:${d.orb}`).join(',')
}

/** Local date-time input (`datetime-local`) + timezone-offset hours, a fixed Julian Day, or "now". */
export interface MomentForm {
  mode: 'now' | 'dt' | 'jd'
  dt: string
  tzoh: number
  jd: number
}

export function useMomentForm(): MomentForm {
  const prefs = usePreferencesStore()
  return reactive({ mode: 'now', dt: '', tzoh: prefs.tzOffsetHours, jd: 2451545.0 })
}

export function momentParams(form: MomentForm): Record<string, unknown> {
  switch (form.mode) {
    case 'jd':
      return { jd: form.jd }
    case 'dt':
      return { dt: form.dt, tzoh: form.tzoh }
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
  ps: 'geo' | 'topo'
}

export function useViewForm(): ViewForm {
  const prefs = usePreferencesStore()
  return reactive({ useLocation: true, cs: prefs.cs, ps: prefs.ps })
}

export function viewParams(form: ViewForm): Record<string, unknown> {
  const prefs = usePreferencesStore()
  return {
    cs: form.cs,
    ps: form.ps,
    ...(form.useLocation ? { loc: prefs.loc } : {}),
  }
}
