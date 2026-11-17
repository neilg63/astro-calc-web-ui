<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, rangeEndParams, useMomentForm, useRangeEndForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import RangeEndFields from '../components/RangeEndFields.vue'
import BodySelect from '../components/BodySelect.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { round } from '../lib/format'
import type { StationsForBody } from '../api/types'

const OUTER_PLANETS = ['me', 've', 'ma', 'ju', 'sa', 'ur', 'ne', 'pl']

const moment = useMomentForm()
const rangeEnd = useRangeEndForm()
const bodies = reactive({ keys: [...OUTER_PLANETS] })
const opts = reactive({ num: 4, before: 0 })

interface StationsResult {
  date: unknown
  end: unknown
  bodies: StationsForBody[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<StationsResult>('/stations')

const rows = computed(() => {
  const res = data.value
  if (!res) return []
  return res.bodies.flatMap((b) => b.stations.map((s) => ({ key: b.key, current_speed: b.speed, retrograde: b.retrograde, ...s })))
})

function submit() {
  run({ bodies: bodies.keys, ...momentParams(moment), ...rangeEndParams(rangeEnd), num: opts.num, before: opts.before })
}
</script>

<template>
  <section class="view-page view-stations">
  <h1 class="view-title title">Stations</h1>
  <p class="view-subtitle subtitle">Each body's current speed and its retrograde/direct stations.</p>

  <div class="view-form box horizontal-form">
    <BodySelect v-model="bodies.keys" />
    <MomentFields :form="moment" />
    <RangeEndFields :form="rangeEnd" />
    <b-field grouped group-multiline>
      <b-field label="Count (when open-ended)" label-position="on-border">
        <b-numberinput size="is-small" v-model="opts.num" :min="1" :max="1000" :controls="false" />
      </b-field>
      <b-field label="Before" label-position="on-border">
        <b-numberinput size="is-small" v-model="opts.before" :min="0" :controls="false" />
      </b-field>
    </b-field>
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default>
      <b-table :data="rows" striped narrowed paginated per-page="25">
        <b-table-column field="key" label="Body" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="current_speed" label="Current speed" v-slot="props">{{ round(props.row.current_speed) }}</b-table-column>
        <b-table-column field="retrograde" label="Retrograde" v-slot="props">{{ props.row.retrograde ? 'yes' : 'no' }}</b-table-column>
        <b-table-column field="type" label="Station type" v-slot="props">{{ props.row.type }}</b-table-column>
        <b-table-column field="speed" label="Speed at station" v-slot="props">{{ round(props.row.speed) }}</b-table-column>
        <b-table-column field="utc" label="When" v-slot="props"><UtcTime :value="props.row" /></b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
