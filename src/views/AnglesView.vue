<script setup lang="ts">
import { computed } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { usePreferencesStore } from '../stores/preferences'
import { round } from '../lib/format'
import type { Angles, GeoJson } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()

interface AnglesResult {
  date: unknown
  geo: GeoJson
  angles: Angles
}

const { data, error, loading, run, lastUrl } = useEndpoint<AnglesResult>('/angles')

const rows = computed(() => {
  const a = data.value?.angles
  if (!a) return []
  return Object.entries(a).map(([key, value]) => ({ key, value }))
})

function submit() {
  run({ ...momentParams(moment), loc: prefs.loc })
}
</script>

<template>
  <section class="view-page view-angles">
  <h1 class="view-title title">Angles</h1>
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <LocationFields />
    <b-button type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default>
      <b-table :data="rows" striped narrowed>
        <b-table-column field="key" label="Angle" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="value" label="Degrees" v-slot="props">{{ round(props.row.value) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
