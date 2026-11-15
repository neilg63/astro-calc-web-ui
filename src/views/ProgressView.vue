<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm, viewParams } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { formatMoment, round } from '../lib/format'
import type { AyanamshaValue, GeoJson, Moment } from '../api/types'

const moment = useMomentForm()
const view = useViewForm()
const bodies = reactive({ keys: [...CORE_BODY_KEYS] })
const span = reactive({ unit: 'days' as 'days' | 'years', amount: 7, pd: 1 })

interface ProgressItem {
  lng: number
  lat: number
  lng_speed: number
  lat_speed: number
  dist: number
  dist_speed: number
  jd: number
  age?: number
  date?: Moment
}

interface ProgressBody {
  key: string
  items: ProgressItem[]
}

interface ProgressResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  progressed: boolean
  span: number
  unit: string
  per_unit: number
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  bodies: ProgressBody[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<ProgressResult>('/progress')

const rows = computed(() => {
  const res = data.value
  if (!res) return []
  return res.bodies.flatMap((b) => b.items.map((item) => ({ key: b.key, ...item })))
})

function submit() {
  run({
    bodies: bodies.keys,
    ...momentParams(moment),
    ...viewParams(view),
    pd: span.pd,
    days: span.unit === 'days' ? span.amount : undefined,
    years: span.unit === 'years' ? span.amount : undefined,
  })
}
</script>

<template>
  <section class="view-page view-progress">
  <h1 class="view-title title">Progress</h1>
  <p class="view-subtitle subtitle">A series of positions over time, or a secondary-progression series (one day per year).</p>

  <div class="view-form box horizontal-form">
    <BodySelect v-model="bodies.keys" />
    <MomentFields :form="moment" label="Start" />
    <ViewFields :form="view" />
    <b-field grouped group-multiline>
      <b-field label="Span unit" label-position="on-border">
        <b-select size="is-small" v-model="span.unit">
          <option value="days">Days</option>
          <option value="years">Years (secondary progression)</option>
        </b-select>
      </b-field>
      <b-field :label="span.unit === 'days' ? 'Days' : 'Years'" label-position="on-border">
        <b-numberinput size="is-small" v-model="span.amount" :min="0" :controls="false" />
      </b-field>
      <b-field label="Samples per unit" label-position="on-border">
        <b-numberinput size="is-small" v-model="span.pd" :min="0.01" :step="0.5" :controls="false" />
      </b-field>
    </b-field>
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default>
      <b-table :data="rows" striped narrowed paginated per-page="25">
        <b-table-column field="key" label="Body" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="jd" label="JD" v-slot="props">{{ round(props.row.jd, 5) }}</b-table-column>
        <b-table-column v-if="(data as ProgressResult).progressed" field="date" label="Date" v-slot="props">{{ formatMoment(props.row.date) }}</b-table-column>
        <b-table-column v-if="(data as ProgressResult).progressed" field="age" label="Age" v-slot="props">{{ round(props.row.age, 3) }}</b-table-column>
        <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
        <b-table-column field="lat" label="Latitude" v-slot="props">{{ round(props.row.lat) }}</b-table-column>
        <b-table-column field="lng_speed" label="Lng speed" v-slot="props">{{ round(props.row.lng_speed) }}</b-table-column>
        <b-table-column field="dist" label="Distance" v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
