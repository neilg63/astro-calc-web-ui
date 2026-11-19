import { defineStore } from 'pinia'
import { createApiClient } from '../api/client'
import type { BodyRef, StarRef } from '../api/types'
import { usePreferencesStore } from './preferences'
import { orderAyanamshas } from '../lib/zodiac'

export interface HouseSystemRef {
  code: string
  name: string
}

export interface AyanamshaRef {
  key: string
  name: string
}

interface ReferenceState {
  bodies: BodyRef[]
  stars: StarRef[]
  houseSystems: HouseSystemRef[]
  ayanamshas: AyanamshaRef[]
  loaded: boolean
  loading: boolean
  error: string | null
}

export const CORE_BODY_KEYS = ['su', 'mo', 'me', 've', 'ma', 'ju', 'sa', 'ur', 'ne', 'pl']

export const useReferenceStore = defineStore('reference', {
  state: (): ReferenceState => ({
    bodies: [],
    stars: [],
    houseSystems: [],
    ayanamshas: [],
    loaded: false,
    loading: false,
    error: null,
  }),
  getters: {
    /** The API's name of an ayanamsha given its key (or its name); the value itself if unknown. */
    ayanamshaName: (state) => (keyOrName: string) => state.ayanamshas.find((a) => a.key === keyOrName || a.name === keyOrName)?.name ?? keyOrName,
  },
  actions: {
    async loadAll(force = false) {
      if (this.loaded && !force) return
      // Many components ask at once as a page mounts: one request in flight is enough.
      if (this.loading && !force) return
      this.loading = true
      this.error = null
      try {
        const prefs = usePreferencesStore()
        const client = createApiClient(prefs.apiBase)
        const [bodiesRes, starsRes, ayaRes, housesRes] = await Promise.all([
          client.get('/bodies'),
          client.get('/stars'),
          client.get('/ayanamsha', { params: { aya: 'all' } }),
          client.get('/houses', { params: { hsys: 'all', loc: prefs.loc } }),
        ])
        this.bodies = bodiesRes.data.bodies ?? []
        this.stars = starsRes.data.stars ?? []
        this.ayanamshas = orderAyanamshas(
          (ayaRes.data.ayanamshas ?? [])
            .filter((a: { key: string | null }) => a.key)
            .map((a: { key: string; name: string }): AyanamshaRef => ({ key: a.key, name: a.name })),
        )
        this.houseSystems = (housesRes.data.sets ?? []).map((s: { system: string; name: string }) => ({ code: s.system, name: s.name }))
        this.loaded = true
      } catch (err) {
        this.error = err instanceof Error ? err.message : String(err)
      } finally {
        this.loading = false
      }
    },
  },
})
