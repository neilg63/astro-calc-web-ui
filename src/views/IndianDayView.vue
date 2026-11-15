<script setup lang="ts">
import { computed } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { usePreferencesStore } from '../stores/preferences'
import { formatMoment, round } from '../lib/format'
import type { GeoJson, Moment } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()

interface IndianDayResult {
  date: unknown
  geo: GeoJson
  rise: Moment
  set: Moment
  next_rise: Moment
  kind: string
  is_day_time: boolean
  day_length: number
  daylight_length: number
  night_length: number
  progress: number
  muhurta: number
  ghati: number
  vighati: number
  lipta: number
  half_day_muhurta: number
  weekday: number
  display: string
}

const { data, error, loading, run, lastUrl } = useEndpoint<IndianDayResult>('/indian-day')

const rows = computed(() => {
  const res = data.value
  if (!res) return []
  return [
    ['Kind', res.kind],
    ['Rise', formatMoment(res.rise)],
    ['Set', formatMoment(res.set)],
    ['Next rise', formatMoment(res.next_rise)],
    ['Is day time', res.is_day_time ? 'yes' : 'no'],
    ['Day length (days)', round(res.day_length, 5)],
    ['Daylight length (days)', round(res.daylight_length, 5)],
    ['Night length (days)', round(res.night_length, 5)],
    ['Progress', round(res.progress, 5)],
    ['Muhurta', round(res.muhurta, 3)],
    ['Ghati', round(res.ghati, 3)],
    ['Vighati', round(res.vighati, 3)],
    ['Lipta', round(res.lipta, 3)],
    ['Half-day muhurta', round(res.half_day_muhurta, 3)],
    ['Weekday', res.weekday],
    ['Display', res.display],
  ].map(([key, value]) => ({ key, value }))
})

function submit() {
  run({ ...momentParams(moment), loc: prefs.loc })
}
</script>

<template>
  <section class="view-page view-indian-day">
  <h1 class="view-title title">Indian Day</h1>
  <p class="view-subtitle subtitle">The sunrise-to-sunrise day containing the date, with ghati/vighati time units.</p>

  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <LocationFields />
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default>
      <b-table :data="rows" striped narrowed>
        <b-table-column field="key" label="Field" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="value" label="Value" v-slot="props">{{ props.row.value }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
