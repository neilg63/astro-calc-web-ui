<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS, useReferenceStore } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaSelect from '../components/AyanamshaSelect.vue'
import BodySelect from '../components/BodySelect.vue'
import SingleBodySelect from '../components/SingleBodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { round } from '../lib/format'
import type { AyanamshaValue, ExtendedBodyPosition, GeoJson } from '../api/types'

/** `/extended-position` (one body) when `single`, else `/extended-positions`. */
const props = defineProps<{ single?: boolean }>()

const reference = useReferenceStore()
const prefs = usePreferencesStore()
const moment = useMomentForm()
const view = useViewForm()
const form = reactive({ body: 'su', bodies: [...CORE_BODY_KEYS], aya: '', speeds: false })

interface ExtendedResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  /** `/extended-positions` */
  bodies?: ExtendedBodyPosition[]
  /** `/extended-position` */
  body?: ExtendedBodyPosition
}

const { data, error, loading, run, lastUrl } = useEndpoint<ExtendedResult>(props.single ? '/extended-position' : '/extended-positions')

const rows = computed<ExtendedBodyPosition[]>(() => {
  const res = data.value
  if (!res) return []
  return res.bodies ?? (res.body ? [res.body] : [])
})

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

function submit() {
  run({
    ...(props.single ? { body: form.body } : { bodies: form.bodies }),
    ...momentParams(moment),
    ps: view.ps,
    loc: prefs.loc,
    aya: form.aya,
    sid: form.aya ? 1 : undefined,
  })
}
</script>

<template>
  <section class="view-page" :class="single ? 'view-extended-position' : 'view-extended-positions'">
    <h1 class="view-title title">{{ single ? 'Extended Position' : 'Extended Positions' }}</h1>
    <p class="view-subtitle subtitle">Ecliptic, equatorial and horizontal coordinates together. Needs a place.</p>

    <div class="view-form box horizontal-form">
      <SingleBodySelect v-if="single" v-model="form.body" />
      <BodySelect v-else v-model="form.bodies" />
      <MomentFields :form="moment" />
      <ViewFields :form="view" hide-cs location-required />
      <AyanamshaSelect v-model="form.aya" />
      <b-field>
        <b-checkbox size="is-small" v-model="form.speeds">Show speeds</b-checkbox>
      </b-field>
      <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          {{ (res as ExtendedResult).ps }} ·
          <template v-if="(res as ExtendedResult).sidereal && (res as ExtendedResult).ayanamshas.length">
            sidereal longitude ({{ (res as ExtendedResult).ayanamshas[0].name }}, {{ round((res as ExtendedResult).ayanamshas[0].value, 4) }}°)
          </template>
          <template v-else>tropical longitude</template>
          · angles in degrees, speeds in °/day, distance in AU
        </p>
        <b-table :data="rows" striped narrowed scrollable>
          <b-table-column field="key" label="Body" v-slot="props">{{ bodyName(props.row.key) }} ({{ props.row.key }})</b-table-column>
          <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
          <b-table-column field="lat" label="Latitude" numeric v-slot="props">{{ round(props.row.lat) }}</b-table-column>
          <b-table-column field="ras" label="Right asc." numeric v-slot="props">{{ round(props.row.ras) }}</b-table-column>
          <b-table-column field="dcl" label="Declination" numeric v-slot="props">{{ round(props.row.dcl) }}</b-table-column>
          <b-table-column field="azi" label="Azimuth" numeric v-slot="props">{{ round(props.row.azi) }}</b-table-column>
          <b-table-column field="alt" label="Altitude" numeric v-slot="props">{{ round(props.row.alt) }}</b-table-column>
          <b-table-column field="lng_speed" label="Lng speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.lng_speed) }}</b-table-column>
          <b-table-column field="lat_speed" label="Lat speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.lat_speed) }}</b-table-column>
          <b-table-column field="ras_speed" label="RA speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.ras_speed) }}</b-table-column>
          <b-table-column field="dcl_speed" label="Decl speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.dcl_speed) }}</b-table-column>
          <b-table-column field="azi_speed" label="Azi speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.azi_speed) }}</b-table-column>
          <b-table-column field="alt_speed" label="Alt speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.alt_speed) }}</b-table-column>
          <b-table-column field="dist" label="Distance" numeric v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
          <b-table-column field="dist_speed" label="Dist speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.dist_speed, 6) }}</b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
