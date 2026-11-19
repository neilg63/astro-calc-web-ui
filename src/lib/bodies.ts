/**
 * Unicode symbols of the bodies and points, by API key. They are shown before a body's
 * abbreviation or name; a body with no entry is shown without one.
 *
 * U+FE0E after a symbol asks for the plain text glyph where a colour emoji also exists.
 */
const TEXT = '︎'

export const BODY_SYMBOLS: Record<string, string> = {
  as: '☊',
  su: `☀${TEXT}`,
  mo: '☾',
  me: `☿${TEXT}`,
  ve: `♀${TEXT}`,
  ea: '⊕',
  ma: `♂${TEXT}`,
  ju: '♃',
  sa: '♄',
  ur: '♅',
  ne: '♆',
  pl: '♇',
  // Lunar nodes
  mn: '☊',
  ra: '☊',
  ms: '☋',
  ke: '☋',
  // Lunar apogee (Black Moon Lilith)
  ml: '⚸',
  ol: '⚸',
  ia: '⚸',
  // Minor planets
  ch: '⚷',
  ce: '⚳',
  pa: '⚴',
  jn: '⚵',
  vs: '⚶',
}

/** The symbol of a body, or an empty string when it has none. */
export function bodySymbol(key: string): string {
  return BODY_SYMBOLS[key] ?? ''
}

/** A label with the body's symbol in front, e.g. `♃ Jupiter` or `♃ ju`. */
export function withBodySymbol(key: string, label: string = key): string {
  const symbol = bodySymbol(key)
  return symbol ? `${symbol} ${label}` : label
}
