/** The observer's position: the API's `ps` parameter. */
export type PerspectiveKey = 'geo' | 'topo' | 'local' | 'helio' | 'seleno' | 'hermeo' | 'cythero' | 'areo' | 'jovi' | 'crono' | 'bary'

export interface PerspectiveOption {
  key: PerspectiveKey
  name: string
  /** Where the observer is, for the option's tooltip. */
  observer: string
  /** On the Earth (its centre or surface): the only perspectives with horizontal coordinates. */
  earth: boolean
  /** Needs a place on the Earth's surface. */
  needsLocation: boolean
  /** The body at the centre, which cannot be observed from there. */
  centre?: string
}

/** Topocentric comes first: it is the default wherever an endpoint accepts it. */
export const PERSPECTIVES: PerspectiveOption[] = [
  { key: 'topo', name: 'Topocentric', observer: "A place on the Earth's surface", earth: true, needsLocation: true },
  { key: 'geo', name: 'Geocentric', observer: 'Centre of the Earth', earth: true, needsLocation: false },
  { key: 'local', name: 'Local space (horizon)', observer: 'A place on the Earth, with azimuth from north and altitude', earth: true, needsLocation: true },
  { key: 'helio', name: 'Heliocentric', observer: 'Centre of the Sun', earth: false, needsLocation: false, centre: 'su' },
  { key: 'seleno', name: 'Selenocentric', observer: 'Centre of the Moon', earth: false, needsLocation: false, centre: 'mo' },
  { key: 'hermeo', name: 'Hermeocentric', observer: 'Centre of Mercury', earth: false, needsLocation: false, centre: 'me' },
  { key: 'cythero', name: 'Cytherocentric', observer: 'Centre of Venus', earth: false, needsLocation: false, centre: 've' },
  { key: 'areo', name: 'Areocentric', observer: 'Centre of Mars', earth: false, needsLocation: false, centre: 'ma' },
  { key: 'jovi', name: 'Jovicentric', observer: 'Centre of Jupiter', earth: false, needsLocation: false, centre: 'ju' },
  { key: 'crono', name: 'Cronocentric', observer: 'Centre of Saturn', earth: false, needsLocation: false, centre: 'sa' },
  { key: 'bary', name: 'Barycentric', observer: 'Centre of mass of the solar system', earth: false, needsLocation: false },
]

/** The perspectives with an observer on the Earth, for endpoints that need horizontal coordinates. */
export const EARTH_PERSPECTIVES: PerspectiveKey[] = ['topo', 'geo', 'local']

/** Points that exist only as seen from the Earth: the lunar nodes and apsides, and the ascendant. */
const EARTH_ONLY_BODIES = ['mn', 'ra', 'ms', 'ke', 'ml', 'ol', 'ia', 'ip', 'as']

export function perspective(key: string): PerspectiveOption {
  return PERSPECTIVES.find((p) => p.key === key) ?? PERSPECTIVES[0]!
}

export interface PerspectiveBodies {
  /** The body keys to send. */
  keys: string[]
  /** Selected bodies that cannot be observed from this perspective. */
  dropped: string[]
  /** True when the Earth was added, as the API does for its own default sets. */
  earthAdded: boolean
}

/**
 * The bodies of a positions request. From a place on the Earth's surface the ascendant (`as`)
 * always leads the list, whether or not it was selected.
 */
export function positionBodies(selected: string[], key: string): string[] {
  const keys = observableBodies(selected, key)
  return perspective(key).needsLocation && !keys.includes('as') ? ['as', ...keys] : keys
}

/**
 * Adapts a selection of bodies to a perspective, as the API adapts its own default sets:
 * away from the Earth the centre itself and the Earth-only points are left out and the Earth
 * (`ea`) joins the list; on the Earth, the Earth is left out.
 */
export function perspectiveBodies(selected: string[], key: string): PerspectiveBodies {
  const ps = perspective(key)
  const hidden = hiddenBodies(key)
  const keys = selected.filter((k) => !hidden.includes(k))
  const dropped = selected.filter((k) => hidden.includes(k))
  const earthAdded = !ps.earth && keys.length > 0 && !keys.includes('ea')
  if (earthAdded) {
    // The Earth takes its place in order from the Sun, after Venus.
    const after = Math.max(keys.indexOf('ve'), keys.indexOf('me'), keys.indexOf('mo'), keys.indexOf('su'))
    keys.splice(after + 1, 0, 'ea')
  }
  return { keys, dropped, earthAdded }
}

/** The bodies a perspective cannot show: the Earth from the Earth; elsewhere the centre and the Earth-only points. */
export function hiddenBodies(key: string): string[] {
  const ps = perspective(key)
  return ps.earth ? ['ea'] : [...EARTH_ONLY_BODIES, ...(ps.centre ? [ps.centre] : [])]
}

/** A selection without the bodies the perspective cannot show: what a request sends. */
export function observableBodies(selected: string[], key: string): string[] {
  const hidden = hiddenBodies(key)
  return selected.filter((k) => !hidden.includes(k))
}

/**
 * What a perspective did to a selection of bodies, as a line for the reader, such as
 * "Sun is not observable and Earth is added." Empty when nothing changed.
 */
export function perspectiveNote(droppedNames: string[], earthAdded: boolean): string {
  const parts = []
  if (droppedNames.length) {
    const list = droppedNames.length > 1 ? `${droppedNames.slice(0, -1).join(', ')} and ${droppedNames[droppedNames.length - 1]}` : droppedNames[0]
    parts.push(`${list} ${droppedNames.length > 1 ? 'are' : 'is'} not observable`)
  }
  if (earthAdded) parts.push('Earth is added')
  return parts.length ? `${parts.join(' and ')}.` : ''
}
