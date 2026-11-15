<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { useReferenceStore } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm, viewParams } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaFields, { type AyanamshaFormValue } from '../components/AyanamshaFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { round } from '../lib/format'
import type { AyanamshaValue, BodyPosition, GeoJson } from '../api/types'

const reference = useReferenceStore()
onMounted(() => reference.loadAll())

const moment = useMomentForm()
const view = useViewForm()
const body = reactive({ key: 'su' })
const aya = reactive<AyanamshaFormValue>({ aya: [], sid: false })

interface PositionResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  body: BodyPosition
}

const { data, error, loading, run, lastUrl } = useEndpoint<PositionResult>('/position')

function submit() {
  run({ body: body.key, ...momentParams(moment), ...viewParams(view), aya: aya.aya, sid: aya.sid ? 1 : undefined })
}
</script>

<template>
  <section class="view-page view-position">
  <h1 class="view-title title">Position</h1>
  <p class="view-subtitle subtitle">One body's ecliptic, equatorial or horizontal position.</p>

  <div class="view-form box horizontal-form">
    <b-field label="Body" label-position="on-border">
      <b-select size="is-small" v-model="body.key">
        <option v-for="b in reference.bodies" :key="b.key" :value="b.key" :disabled="!b.available">{{ b.name }} ({{ b.key }})</option>
      </b-select>
    </b-field>
    <MomentFields :form="moment" />
    <ViewFields :form="view" />
    <AyanamshaFields v-model="aya" show-sidereal />
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="[(res as PositionResult).body]" striped narrowed>
        <b-table-column field="key" label="Body" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
        <b-table-column field="lat" label="Latitude" v-slot="props">{{ round(props.row.lat) }}</b-table-column>
        <b-table-column field="lng_speed" label="Lng speed" v-slot="props">{{ round(props.row.lng_speed) }}</b-table-column>
        <b-table-column field="lat_speed" label="Lat speed" v-slot="props">{{ round(props.row.lat_speed) }}</b-table-column>
        <b-table-column field="dist" label="Distance" v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
        <b-table-column field="dist_speed" label="Dist speed" v-slot="props">{{ round(props.row.dist_speed, 6) }}</b-table-column>
      </b-table>

      <b-table v-if="(res as PositionResult).ayanamshas.length" class="mt-4" :data="(res as PositionResult).ayanamshas" striped narrowed>
        <b-table-column field="key" label="Ayanamsha" v-slot="props">{{ props.row.name }}</b-table-column>
        <b-table-column field="value" label="Value" v-slot="props">{{ round(props.row.value) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
