<script setup lang="ts">
import { reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import HouseSystemSelect from '../components/HouseSystemSelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { usePreferencesStore } from '../stores/preferences'
import type { Angles, GeoJson, HouseSet } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()
const systems = reactive({ codes: [...prefs.houseSystems] })

interface HousesResult {
  date: unknown
  geo: GeoJson
  angles: Angles
  sets: HouseSet[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<HousesResult>('/houses')

function submit() {
  run({ ...momentParams(moment), loc: prefs.loc, hsys: systems.codes })
}
</script>

<template>
  <section class="view-page view-houses">
  <h1 class="view-title title">Houses</h1>
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <LocationFields />
    <HouseSystemSelect v-model="systems.codes" />
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="(res as HousesResult).sets" striped narrowed>
        <b-table-column field="name" label="System" v-slot="props">{{ props.row.name }} ({{ props.row.system }})</b-table-column>
        <b-table-column v-for="i in 12" :key="i" :field="`cusp${i}`" :label="`${i}`" v-slot="props">
          <DegreeValue :value="props.row.cusps[i - 1]" />
        </b-table-column>
        <b-table-column field="fallback" label="Fallback" v-slot="props">{{ props.row.fallback ?? '—' }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
