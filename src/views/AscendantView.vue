<script setup lang="ts">
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { usePreferencesStore } from '../stores/preferences'
import type { GeoJson } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()

interface AscendantResult {
  date: unknown
  geo: GeoJson
  ascendant: number
}

const { data, error, loading, run, lastUrl } = useEndpoint<AscendantResult>('/ascendant')

function submit() {
  run({ ...momentParams(moment), loc: prefs.loc })
}
</script>

<template>
  <section class="view-page view-ascendant">
  <h1 class="view-title title">Ascendant</h1>
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <LocationFields />
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <p class="title is-4"><DegreeValue :value="(res as AscendantResult).ascendant" /></p>
    </template>
  </ResultPanel>
  </section>
</template>
