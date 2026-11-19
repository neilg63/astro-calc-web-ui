/** The bodies the transposed endpoints take by default: the Sun, the Moon and the planets to Saturn. */
export const TRANSPOSED_BODY_KEYS = ['su', 'mo', 'me', 've', 'ma', 'ju', 'sa']

/** Transposed points need an observer on the Earth: at its centre or at the two places. */
export type TransposedPerspective = 'topo' | 'geo'
