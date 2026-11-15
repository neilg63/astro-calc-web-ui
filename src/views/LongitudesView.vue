<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { useReferenceStore } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaSelect from '../components/AyanamshaSelect.vue'
import BodySelect from '../components/BodySelect.vue'
import SingleBodySelect from '../components/SingleBodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { round } from '../lib/format'
import type { AyanamshaValue, BodyLongitude, GeoJson } from '../api/types'

/** `/longitude` (one body) when `single`, else `/longitudes`. */
const props = defineProps<{ single?: boolean }>()

const reference = useReferenceStore()
const prefs = usePreferencesStore()
const moment = useMomentForm()
const view = useViewForm()
const form = reactive({ body: 'su', bodies: ['as', 'su', 'mo', 'me', 've', 'ma', 'ju', 'sa', 'ur', 'ne', 'pl', 'ke', 'ra'], aya: '' })

interface LongitudesResult {
  date: unknown
  geo: GeoJson
  ps: string
  sidereal: boolean
  ayanamsha: AyanamshaValue | null
  /** `/longitudes` */
  longitudes?: BodyLongitude[]
  /** `/longitude` */
  key?: string
  lng?: number
  engine?: string
}

const { data, error, loading, run, lastUrl } = useEndpoint<LongitudesResult>(props.single ? '/longitude' : '/longitudes')

const rows = computed<BodyLongitude[]>(() => {
  const res = data.value
  if (!res) return []
  if (res.longitudes) return res.longitudes
  return res.key !== undefined && res.lng !== undefined ? [{ key: res.key, lng: res.lng }] : []
})

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

function submit() {
  // Without a place the ascendant cannot be calculated, and naming it is an error.
  const keys = view.useLocation ? form.bodies : form.bodies.filter((k) => k !== 'as')
  run({
    ...(props.single ? { body: form.body } : { bodies: keys }),
    ...momentParams(moment),
    ps: view.ps,
    loc: view.useLocation || view.ps === 'topo' ? prefs.loc : undefined,
    aya: form.aya,
  })
}
</script>

<template>
  <section class="view-page" :class="single ? 'view-longitude' : 'view-longitudes'">
    <h1 class="view-title title">{{ single ? 'Longitude' : 'Longitudes' }}</h1>
    <p class="view-subtitle subtitle">Ecliptic longitude only: about half the cost of full positions.</p>

    <div class="view-form box horizontal-form">
      <SingleBodySelect v-if="single" v-model="form.body" />
      <BodySelect v-else v-model="form.bodies" />
      <MomentFields :form="moment" />
      <ViewFields :form="view" hide-cs :location-required="view.ps === 'topo'" />
      <AyanamshaSelect v-model="form.aya" />
      <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          {{ (res as LongitudesResult).ps }} ·
          <template v-if="(res as LongitudesResult).ayanamsha">
            sidereal ({{ (res as LongitudesResult).ayanamsha!.name }}, {{ round((res as LongitudesResult).ayanamsha!.value, 4) }}°)
          </template>
          <template v-else>tropical</template>
          <template v-if="(res as LongitudesResult).engine"> · engine: {{ (res as LongitudesResult).engine }}</template>
        </p>
        <b-table :data="rows" striped narrowed>
          <b-table-column field="key" label="Body" v-slot="props">{{ bodyName(props.row.key) }} ({{ props.row.key }})</b-table-column>
          <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
          <b-table-column field="lng" label="Decimal" numeric v-slot="props">{{ round(props.row.lng, 6) }}</b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
