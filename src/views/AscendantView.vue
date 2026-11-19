<script setup lang="ts">
import RunButton from '../components/RunButton.vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { usePreferencesStore } from '../stores/preferences'
import PointsTable from '../components/PointsTable.vue'
import type { Angles, GeoJson } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()

interface AscendantResult {
  date: unknown
  geo: GeoJson
  /** Deprecated in the API: the same value as `points.ascendant`. */
  ascendant: number
  points?: Angles
}

const { data, error, loading, run, lastUrl } = useEndpoint<AscendantResult>('/ascendant')

function submit() {
  run({ ...momentParams(moment), loc: prefs.loc })
}
</script>

<template>
  <section class="view-page view-ascendant">
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <LocationFields />
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <p class="title is-4"><DegreeValue :value="(res as AscendantResult).points?.ascendant ?? (res as AscendantResult).ascendant" /></p>
      <PointsTable v-if="(res as AscendantResult).points" :points="(res as AscendantResult).points!" />
    </template>
  </ResultPanel>
  </section>
</template>
