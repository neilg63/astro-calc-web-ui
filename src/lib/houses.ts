/** Names shorter than this are shown as they are. */
const SHORTEN_FROM = 12

/** Shorter labels for the house systems with long names, by the API's letter; the full name goes in a tooltip. */
const SHORT_NAMES: Record<string, string> = {
  V: 'Vehlow',
  R: 'Regiomont.',
  T: 'Topocentric',
  X: 'Meridian',
  H: 'Horizontal',
  U: 'Krusinski',
  G: 'Gauquelin',
}

/** The label of a house system: its name, or a shorter form when the name is 12 characters or more. */
export function shortHouseName(system: { system?: string; code?: string; name: string }): string {
  if (system.name.length < SHORTEN_FROM) return system.name
  return SHORT_NAMES[system.system ?? system.code ?? ''] ?? system.name
}

/** The full name with the API's letter, e.g. `Placidus (P)`. */
export function fullHouseName(system: { system?: string; code?: string; name: string }): string {
  return `${system.name} (${system.system ?? system.code})`
}
