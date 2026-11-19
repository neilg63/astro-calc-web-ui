import { computed, reactive, type WritableComputedRef } from 'vue'
import type { AspectDef, HistoricChoice, MomentChoice } from '../stores/preferences'
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

/** The zodiac of a form: an ayanamsha key (none for tropical) and whether longitudes are sidereal. */
export interface AyanamshaChoice {
  aya: string[]
  sid: boolean
}

/**
 * Whether an ayanamsha means anything from a perspective. The sidereal zodiacs are offsets
 * of the Earth's equinox, so only an observer on the Earth has one; from any other centre
 * longitudes are tropical.
 */
export function ayanamshaApplies(ps: PerspectiveKey): boolean {
  return perspective(ps).earth
}

/**
 * The ayanamsha choice shared by every page that has one. Like the date-time and the
 * location, it lives in the preferences store, so it carries from page to page and is still
 * there on the next visit.
 *
 * Given the page's perspective, the choice reads as tropical while that perspective is away
 * from the Earth. The stored choice is left alone meanwhile, so it applies again on return.
 */
export function useAyanamshaChoice(ps?: () => PerspectiveKey): WritableComputedRef<AyanamshaChoice> {
  const prefs = usePreferencesStore()
  return computed({
    get: () => (ps && !ayanamshaApplies(ps()) ? { aya: [], sid: false } : { aya: prefs.ayanamshas, sid: prefs.sidereal }),
    set: (choice) => {
      if (ps && !ayanamshaApplies(ps())) return
      prefs.ayanamshas = choice.aya
      prefs.sidereal = choice.aya.length > 0 && choice.sid
    },
  })
}

/**
 * The same shared choice as one key, '' for tropical, for pages whose longitudes are always
 * sidereal once an ayanamsha is chosen. Leaving tropical turns the sidereal flag on, as the
 * ayanamsha fields do; changing from one ayanamsha to another leaves it as it was. Given the
 * page's perspective, it is '' away from the Earth, as in `useAyanamshaChoice`.
 */
export function useAyanamshaKey(ps?: () => PerspectiveKey): WritableComputedRef<string> {
  const prefs = usePreferencesStore()
  return computed({
    get: () => (ps && !ayanamshaApplies(ps()) ? '' : (prefs.ayanamshas[0] ?? '')),
    set: (key) => {
      if (ps && !ayanamshaApplies(ps())) return
      if (!key) {
        prefs.ayanamshas = []
        prefs.sidereal = false
      } else {
        if (!prefs.ayanamshas.length) prefs.sidereal = true
        prefs.ayanamshas = [key]
      }
    },
  })
}

/** The historic moment and place of the transposed pages, kept in the preferences store. */
export function useHistoricForm(): HistoricChoice {
  return usePreferencesStore().historic
}

/** `h_dt` or `h_jd`, and `h_loc` when the historic place is wanted (the topocentric view). */
export function historicParams(form: HistoricChoice, withPlace = true): Record<string, unknown> {
  const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
  const moment = form.mode === 'jd' ? { h_jd: form.jd } : { h_dt: form.dt }
  if (!withPlace || !isNumber(form.lat) || !isNumber(form.lng)) return moment
  return { ...moment, h_loc: isNumber(form.alt) ? `${form.lat},${form.lng},${form.alt}` : `${form.lat},${form.lng}` }
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
