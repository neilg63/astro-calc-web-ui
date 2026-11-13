<script setup lang="ts">
import { reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm, viewParams } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaFields, { type AyanamshaFormValue } from '../components/AyanamshaFields.vue'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { round } from '../lib/format'
import type { AyanamshaValue, BodyPosition, GeoJson } from '../api/types'

const moment = useMomentForm()
const view = useViewForm()
const bodies = reactive({ keys: [...CORE_BODY_KEYS] })
const aya = reactive<AyanamshaFormValue>({ aya: [], sid: false })

interface PositionsResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  bodies: BodyPosition[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<PositionsResult>('/positions')

function submit() {
  run({ bodies: bodies.keys, ...momentParams(moment), ...viewParams(view), aya: aya.aya, sid: aya.sid ? 1 : undefined })
}
</script>

<template>
  <h1 class="title">Positions</h1>
  <p class="subtitle">Several bodies at one moment.</p>

  <div class="box">
    <BodySelect v-model="bodies.keys" />
    <MomentFields :form="moment" />
    <ViewFields :form="view" />
    <AyanamshaFields v-model="aya" show-sidereal />
    <b-button type="is-primary" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="(res as PositionsResult).bodies" striped narrowed>
        <b-table-column field="key" label="Body" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="lng" label="Longitude" v-slot="props">{{ round(props.row.lng) }}</b-table-column>
        <b-table-column field="lat" label="Latitude" v-slot="props">{{ round(props.row.lat) }}</b-table-column>
        <b-table-column field="lng_speed" label="Lng speed" v-slot="props">{{ round(props.row.lng_speed) }}</b-table-column>
        <b-table-column field="lat_speed" label="Lat speed" v-slot="props">{{ round(props.row.lat_speed) }}</b-table-column>
        <b-table-column field="dist" label="Distance" v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
        <b-table-column field="dist_speed" label="Dist speed" v-slot="props">{{ round(props.row.dist_speed, 6) }}</b-table-column>
      </b-table>

      <b-table v-if="(res as PositionsResult).ayanamshas.length" class="mt-4" :data="(res as PositionsResult).ayanamshas" striped narrowed>
        <b-table-column field="key" label="Ayanamsha" v-slot="props">{{ props.row.name }}</b-table-column>
        <b-table-column field="value" label="Value" v-slot="props">{{ round(props.row.value) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
</template>
