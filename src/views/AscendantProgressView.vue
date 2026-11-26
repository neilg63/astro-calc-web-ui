<script setup lang="ts">
import RunButton from '../components/RunButton.vue'
import { reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import PointsTable from '../components/PointsTable.vue'
import UtcTime from '../components/UtcTime.vue'
import { usePreferencesStore } from '../stores/preferences'
import type { Angles, GeoJson, Moment } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()
const form = reactive({ days: 8, pdays: 1, pd: 24 })

interface AscendantSample {
  jd: number
  lng: number
}

interface AscendantProgressResult {
  date: Moment
  geo: GeoJson
  days: number
  pdays: number
  pd: number
  points: Angles
  ascendants: AscendantSample[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<AscendantProgressResult>('/ascendant-progress')

/** Whether a sample is the moment itself, to within a second. */
function isMoment(row: AscendantSample): boolean {
  return data.value !== null && Math.abs(row.jd - data.value.date.jd) < 1 / 86_400
}

function submit() {
  run({ ...momentParams(moment), loc: prefs.loc, days: form.days, pdays: form.pdays, pd: form.pd })
}
</script>

<template>
  <section class="view-page view-ascendant-progress">
    <p class="view-subtitle subtitle">The ascendant at even steps around a moment, with the chart points of the moment itself.</p>

    <div class="view-form box horizontal-form">
      <MomentFields :form="moment" />
      <LocationFields />
      <b-field label="Days" grouped group-multiline>
        <b-field label="Before" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.pdays" :min="0" step="any" :controls="false" />
        </b-field>
        <b-field label="After" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.days" :min="0" step="any" :controls="false" />
        </b-field>
        <b-field label="Samples per day" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.pd" :min="0.01" step="any" :controls="false" />
        </b-field>
      </b-field>
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          {{ (res as AscendantProgressResult).ascendants.length }} samples · {{ (res as AscendantProgressResult).pd }} per day ·
          {{ (res as AscendantProgressResult).pdays }} days before to {{ (res as AscendantProgressResult).days }} days after
          <UtcTime :value="(res as AscendantProgressResult).date" />
        </p>
        <b-table :data="(res as AscendantProgressResult).ascendants" striped narrowed paginated per-page="100" class="jd-table" :row-class="(row: AscendantSample) => (isMoment(row) ? 'is-selected' : '')">
          <b-table-column field="jd" label="Date-time" v-slot="props"><UtcTime :value="props.row.jd" /></b-table-column>
          <b-table-column field="lng" label="Ascendant" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
        </b-table>
        <div class="points-columns">
          <PointsTable :points="(res as AscendantProgressResult).points" title="Points at the moment" />
        </div>
      </template>
    </ResultPanel>
  </section>
</template>
