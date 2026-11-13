<script setup lang="ts">
import { reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, rangeEndParams, useMomentForm, useRangeEndForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import RangeEndFields from '../components/RangeEndFields.vue'
import LocationFields from '../components/LocationFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { usePreferencesStore } from '../stores/preferences'
import { formatMoment, round } from '../lib/format'
import type { MoonPhaseEntry } from '../api/types'

const moment = useMomentForm()
const rangeEnd = useRangeEndForm()
const prefs = usePreferencesStore()
const opts = reactive({ num: 4, ps: 'geo' as 'geo' | 'topo' })

interface MoonPhasesResult {
  date: unknown
  ps: string
  elongation: number
  elongation_speed: number
  waxing: boolean
  phases: MoonPhaseEntry[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<MoonPhasesResult>('/moon-phases')

function submit() {
  run({
    ...momentParams(moment),
    ...rangeEndParams(rangeEnd),
    num: opts.num,
    ps: opts.ps,
    loc: opts.ps === 'topo' ? prefs.loc : undefined,
  })
}
</script>

<template>
  <section class="view-page view-moon-phases">
  <h1 class="view-title title">Moon Phases</h1>
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <RangeEndFields :form="rangeEnd" />
    <b-field grouped group-multiline>
      <b-field label="Count (when open-ended)" label-position="on-border">
        <b-numberinput v-model="opts.num" :min="1" :max="1000" :controls="false" />
      </b-field>
      <b-field label="Perspective" label-position="on-border">
        <b-select v-model="opts.ps">
          <option value="geo">Geocentric</option>
          <option value="topo">Topocentric</option>
        </b-select>
      </b-field>
    </b-field>
    <LocationFields v-if="opts.ps === 'topo'" />
    <b-button type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <p class="mb-2">
        Elongation {{ round((res as MoonPhasesResult).elongation, 2) }}° ({{ (res as MoonPhasesResult).waxing ? 'waxing' : 'waning' }}),
        speed {{ round((res as MoonPhasesResult).elongation_speed, 4) }}°/day
      </p>
      <b-table :data="(res as MoonPhasesResult).phases" striped narrowed>
        <b-table-column field="phase" label="Phase" v-slot="props">{{ props.row.phase }}</b-table-column>
        <b-table-column field="num" label="#" v-slot="props">{{ props.row.num }}</b-table-column>
        <b-table-column field="utc" label="When" v-slot="props">{{ formatMoment(props.row) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
