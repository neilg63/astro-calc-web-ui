export interface AspectRow {
  key: string
  /** The aspect's angle in degrees: the value the API takes. */
  deg: number
  /** Importance: lower is more important. */
  weight: number
}

export const aspects: Array<AspectRow> = [
  { key: 'opposition', deg: 180.0, weight: 1 },
  { key: 'quadnovile', deg: 160.0, weight: 10 },
  { key: 'triseptile', deg: (360.0 / 7.0) * 3.0, weight: 12 }, // 154.28571
  { key: 'quincunx', deg: 150.0, weight: 2 },
  { key: 'biquintile', deg: 144.0, weight: 8 },
  { key: 'sesquisquare', deg: 135.0, weight: 6 },
  { key: 'trine', deg: 120.0, weight: 4 },
  { key: 'tridecile', deg: 108.0, weight: 9 },
  { key: 'biseptile', deg: 360.0 / 3.5, weight: 15 }, // 102.85714
  { key: 'square', deg: 90.0, weight: 3 },
  { key: 'binovile', deg: 80.0, weight: 9 },
  { key: 'quintile', deg: 72.0, weight: 8 },
  { key: 'sextile', deg: 60.0, weight: 7 },
  { key: 'septile', deg: 360.0 / 7.0, weight: 11 }, // 51.42857
  { key: 'semisquare', deg: 45.0, weight: 6 },
  { key: 'novile', deg: 40.0, weight: 6 },
  { key: 'dectile', deg: 36.0, weight: 8 },
  { key: 'semisextile', deg: 30.0, weight: 5 },
  { key: 'conjunction', deg: 0.0, weight: 0 },
]

/** The aspects shown by default, with their starting orbs. Any other aspect starts at `MINOR_ORB`. */
export const MAIN_ASPECT_ORBS: Record<string, number> = {
  conjunction: 8,
  opposition: 8,
  square: 8,
  trine: 8,
  quincunx: 3,
  sextile: 6,
}

export const MINOR_ORB = 2

export function suggestedOrb(key: string): number {
  return MAIN_ASPECT_ORBS[key] ?? MINOR_ORB
}

/** The named aspect at this angle, if there is one. */
export function aspectByAngle(angle: number): AspectRow | undefined {
  return aspects.find((a) => Math.abs(a.deg - angle) < 1e-6)
}

/** `quincunx (150°)`; a fractional angle keeps two decimals: `septile (51.43°)`. */
export function aspectLabel(angle: number): string {
  const degrees = `${Number(angle.toFixed(2))}°`
  const named = aspectByAngle(angle)
  return named ? `${named.key} (${degrees})` : degrees
}
