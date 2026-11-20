/** Degree/minute/second parts of an angle, already carried/rounded to whole arcseconds. */
export interface Dms {
  deg: number
  min: number
  sec: number
}

export interface SignPosition extends Dms {
  signIndex: number
  signName: string
  signSymbol: string
}

export const ZODIAC_SIGNS: Array<{ name: string; symbol: string }> = [
  { name: 'Aries', symbol: '♈' },
  { name: 'Taurus', symbol: '♉' },
  { name: 'Gemini', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' },
  { name: 'Leo', symbol: '♌' },
  { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' },
  { name: 'Scorpio', symbol: '♏' },
  { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn', symbol: '♑' },
  { name: 'Aquarius', symbol: '♒' },
  { name: 'Pisces', symbol: '♓' },
]

const ARCSECONDS_PER_DEGREE = 3600
const ARCSECONDS_PER_CIRCLE = 360 * ARCSECONDS_PER_DEGREE
const ARCSECONDS_PER_SIGN = 30 * ARCSECONDS_PER_DEGREE

/** Degrees, wrapped into [0, 360), then rounded to the nearest whole arcsecond. */
function totalArcSeconds(value: number): number {
  const wrapped = ((value % 360) + 360) % 360
  const rounded = Math.round(wrapped * ARCSECONDS_PER_DEGREE)
  // Rounding up from just under 360° wraps back to 0.
  return rounded % ARCSECONDS_PER_CIRCLE
}

/** Full 0°–359° degree/minute/second, e.g. 279° 51′ 23″. */
export function fullDms(value: number): Dms {
  const total = totalArcSeconds(value)
  return {
    deg: Math.floor(total / ARCSECONDS_PER_DEGREE),
    min: Math.floor((total % ARCSECONDS_PER_DEGREE) / 60),
    sec: total % 60,
  }
}

/** Zodiac sign plus the 0°–29° position within it, e.g. 9° Capricorn 51′ 23″. */
export function signPosition(value: number): SignPosition {
  const total = totalArcSeconds(value)
  const signIndex = Math.floor(total / ARCSECONDS_PER_SIGN) % 12
  const withinSign = total % ARCSECONDS_PER_SIGN
  const sign = ZODIAC_SIGNS[signIndex]
  return {
    deg: Math.floor(withinSign / ARCSECONDS_PER_DEGREE),
    min: Math.floor((withinSign % ARCSECONDS_PER_DEGREE) / 60),
    sec: withinSign % 60,
    signIndex,
    signName: sign.name,
    signSymbol: sign.symbol,
  }
}

export function formatSignDms(value: number): string {
  const p = signPosition(value)
  return `${p.deg} ${p.signSymbol} ${p.min}' ${p.sec}"`
}

/**
 * The hover text of a longitude: sign name, full-circle DMS, decimal degrees and the zodiac it
 * is measured in, e.g. `Capricorn: 279° 51' 23" | 279.8564° tropical`. `ayanamsha` is the
 * name of the one applied, or null for tropical.
 */
export function formatLongitudeTooltip(value: number, ayanamsha: string | null = null, decimals = 4): string {
  return `${signPosition(value).signName}: ${formatFullDms(value)} | ${formatDecimalDegrees(value, decimals)} ${ayanamsha || 'tropical'}`
}

/**
 * The hover text of a longitude that is itself shown as full-circle DMS: its position by
 * sign, decimal degrees and the zodiac, e.g. `9 ♑ 51' 23" | 279.8564° tropical`.
 */
export function formatSignTooltip(value: number, ayanamsha: string | null = null, decimals = 4): string {
  return `${formatSignDms(value)} | ${formatDecimalDegrees(value, decimals)} ${ayanamsha || 'tropical'}`
}

export function formatFullDms(value: number): string {
  const d = fullDms(value)
  return `${d.deg}° ${d.min}' ${d.sec}"`
}

/**
 * An offset in degrees as DMS without wrapping into the circle, so a negative one keeps its
 * sign: `24° 12' 51"`, `-3° 5' 0"`.
 */
export function formatSignedDms(value: number): string {
  const total = Math.round(Math.abs(value) * ARCSECONDS_PER_DEGREE)
  const sign = value < 0 && total > 0 ? '-' : ''
  return `${sign}${Math.floor(total / ARCSECONDS_PER_DEGREE)}° ${Math.floor((total % ARCSECONDS_PER_DEGREE) / 60)}' ${total % 60}"`
}

export function formatDecimalDegrees(value: number, decimals = 4): string {
  return `${value.toFixed(decimals)}°`
}
