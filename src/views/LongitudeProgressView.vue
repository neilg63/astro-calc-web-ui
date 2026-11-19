<script setup lang="ts">
import { ayanamshaApplies, useAyanamshaKey } from '../lib/queryForms'
import { withBodySymbol } from '../lib/bodies'
import RunButton from '../components/RunButton.vue'
import { ayanamshaLabel } from '../lib/zodiac'
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS, useReferenceStore } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm, viewLocation } from '../lib/queryForms'
import { observableBodies } from '../lib/perspectives'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaSelect from '../components/AyanamshaSelect.vue'
import BodySelect from '../components/BodySelect.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { round } from '../lib/format'
import type { AyanamshaValue, GeoJson, Moment } from '../api/types'

const reference = useReferenceStore()
const moment = useMomentForm()
const view = useViewForm()
const aya = useAyanamshaKey(() => view.ps)
const form = reactive({
  bodies: [...CORE_BODY_KEYS],
  unit: 'days' as 'days' | 'years',
  amount: 30,
  pd: 1,
})

interface ProgressItem {
  jd: number
  lng: number
  lng_speed: number
  age?: number
  date?: Moment
}

interface ProgressResult {
  date: unknown
  geo: GeoJson
  ps: string
  progressed: boolean
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  bodies: { key: string; items: ProgressItem[] }[]
}

/** One sample of the series: a moment, and each body's longitude and its speed. */
interface Row {
  jd: number
  age?: number
  date?: Moment
  cells: Record<string, { lng: number; retrograde: boolean } | undefined>
}

const { data, error, loading, run, lastUrl } = useEndpoint<ProgressResult>('/progress')

const columns = computed(() => data.value?.bodies.map((b) => b.key) ?? [])

/** The bodies' series share their moments, so sample `i` of each body makes row `i`. */
const rows = computed<Row[]>(() => {
  const bodies = data.value?.bodies ?? []
  const first = bodies[0]
  if (!first) return []
  return first.items.map((item, i) => ({
    jd: item.jd,
    age: item.age,
    date: item.date,
    cells: Object.fromEntries(
      bodies.map((b) => {
        const sample = b.items[i]
        return [b.key, sample && { lng: sample.lng, retrograde: sample.lng_speed < 0 }]
      }),
    ),
  }))
})

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

function submit() {
  run({
    bodies: observableBodies(form.bodies, view.ps),
    ...momentParams(moment),
    cs: 'ecl',
    ps: view.ps,
    loc: viewLocation(view),
    pd: form.pd,
    days: form.unit === 'days' ? form.amount : undefined,
    years: form.unit === 'years' ? form.amount : undefined,
    aya: aya.value,
    sid: aya.value ? 1 : undefined,
  })
}
</script>

<template>
  <section class="view-page view-longitude-progress">
    <p class="view-subtitle subtitle">Ecliptic longitudes over time, the bodies side by side. A retrograde longitude is marked ℞.</p>

    <div class="view-form box horizontal-form">
      <BodySelect v-model="form.bodies" :perspective="view.ps" />
      <MomentFields :form="moment" label="Start" />
      <ViewFields :form="view" hide-cs />
      <b-field grouped group-multiline>
        <b-field label="Span unit" label-position="on-border">
          <b-select size="is-small" v-model="form.unit">
            <option value="days">Days</option>
            <option value="years" title="Secondary progression: one day per year">Years</option>
          </b-select>
        </b-field>
        <b-field class="span-amount" :label="form.unit === 'days' ? 'Days' : 'Years'" :title="form.unit === 'days' ? 'Number of days' : 'Number of years'" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.amount" :min="0" :controls="false" />
        </b-field>
        <b-field class="span-per-unit" :label="form.unit === 'days' ? 'Per day' : 'Per year'" :title="form.unit === 'days' ? 'Records per day' : 'Records per year'" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.pd" :min="0.01" step="any" :controls="false" />
        </b-field>
      </b-field>
      <AyanamshaSelect v-if="ayanamshaApplies(view.ps)" v-model="aya" />
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          {{ (res as ProgressResult).ps }} ·
          <template v-if="(res as ProgressResult).sidereal && (res as ProgressResult).ayanamshas.length">
            sidereal ({{ ayanamshaLabel((res as ProgressResult).ayanamshas[0].name) }}, {{ round((res as ProgressResult).ayanamshas[0].value, 4) }}°)
          </template>
          <template v-else>tropical</template>
          · {{ rows.length }} samples
        </p>
        <b-table :data="rows" striped narrowed scrollable paginated per-page="100" class="jd-table longitude-progress-table">
          <b-table-column field="jd" label="Date-time" v-slot="props"><UtcTime :value="props.row.jd" /></b-table-column>
          <b-table-column v-if="(res as ProgressResult).progressed" field="date" label="Life date" v-slot="props"><UtcTime :value="props.row.date" /></b-table-column>
          <b-table-column v-if="(res as ProgressResult).progressed" field="age" label="Age" numeric v-slot="props">{{ round(props.row.age, 3) }}</b-table-column>
          <b-table-column v-for="key in columns" :key="key" :label="withBodySymbol(key, bodyName(key))" v-slot="props">
            <span v-if="props.row.cells[key]" :class="{ 'is-retrograde': props.row.cells[key].retrograde }" :title="props.row.cells[key].retrograde ? 'Retrograde' : undefined">
              <DegreeValue :value="props.row.cells[key].lng" /><template v-if="props.row.cells[key].retrograde"> ℞</template>
            </span>
            <template v-else>—</template>
          </b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
