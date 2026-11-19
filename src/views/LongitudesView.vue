<script setup lang="ts">
import { useAyanamshaKey } from '../lib/queryForms'
import BodyKey from '../components/BodyKey.vue'
import RunButton from '../components/RunButton.vue'
import { ayanamshaLabel } from '../lib/zodiac'
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm, useViewForm, viewLocation } from '../lib/queryForms'
import { observableBodies } from '../lib/perspectives'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaSelect from '../components/AyanamshaSelect.vue'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { round } from '../lib/format'
import type { AyanamshaValue, BodyLongitude, GeoJson } from '../api/types'

const moment = useMomentForm()
const view = useViewForm()
const aya = useAyanamshaKey()
const form = reactive({ bodies: ['as', 'su', 'mo', 'me', 've', 'ma', 'ju', 'sa', 'ur', 'ne', 'pl', 'ke', 'ra'] })

interface LongitudesResult {
  date: unknown
  geo: GeoJson
  ps: string
  sidereal: boolean
  ayanamsha: AyanamshaValue | null
  longitudes: BodyLongitude[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<LongitudesResult>('/longitudes')

const rows = computed<BodyLongitude[]>(() => data.value?.longitudes ?? [])


function submit() {
  // Without a place the ascendant cannot be calculated, and naming it is an error.
  const loc = viewLocation(view)
  // The ascendant needs a place.
  const keys = observableBodies(form.bodies, view.ps).filter((k) => loc || k !== 'as')
  run({
    bodies: keys,
    ...momentParams(moment),
    ps: view.ps,
    loc,
    aya: aya.value,
  })
}
</script>

<template>
  <section class="view-page view-longitudes">
    <p class="view-subtitle subtitle">Ecliptic longitude only: about half the cost of full positions.</p>

    <div class="view-form box horizontal-form">
      <BodySelect v-model="form.bodies" :perspective="view.ps" />
      <MomentFields :form="moment" />
      <ViewFields :form="view" hide-cs />
      <AyanamshaSelect v-model="aya" />
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          {{ (res as LongitudesResult).ps }} ·
          <template v-if="(res as LongitudesResult).ayanamsha">
            sidereal ({{ ayanamshaLabel((res as LongitudesResult).ayanamsha!.name) }}, {{ round((res as LongitudesResult).ayanamsha!.value, 4) }}°)
          </template>
          <template v-else>tropical</template>
        </p>
        <b-table :data="rows" striped narrowed>
          <b-table-column field="key" label="Body" v-slot="props"><BodyKey :value="props.row.key" named /></b-table-column>
          <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
          <b-table-column field="lng" label="Decimal" numeric v-slot="props">{{ round(props.row.lng, 6) }}</b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
