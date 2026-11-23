<script setup lang="ts">
import BodyKey from '../components/BodyKey.vue'
import RunButton from '../components/RunButton.vue'
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { historicParams, momentParams, useHistoricForm, useMomentForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import { TRANSPOSED_BODY_KEYS, type TransposedPerspective } from '../lib/transposed'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import HistoricFields from '../components/HistoricFields.vue'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import PointsList from '../components/PointsList.vue'
import UtcTime from '../components/UtcTime.vue'
import { round } from '../lib/format'
import type { TransposedHead, TransposedPosition } from '../api/types'

const prefs = usePreferencesStore()
const moment = useMomentForm()
const historic = useHistoricForm()
const form = reactive({ bodies: [...TRANSPOSED_BODY_KEYS], ps: 'topo' as TransposedPerspective, speeds: false })

interface TransposedPositionsResult extends TransposedHead {
  bodies: TransposedPosition[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<TransposedPositionsResult>('/transposed-positions')

const rows = computed<TransposedPosition[]>(() => data.value?.bodies ?? [])


function submit() {
  run({
    bodies: form.bodies,
    ...momentParams(moment),
    loc: prefs.loc,
    ...historicParams(historic, form.ps === 'topo'),
    ps: form.ps,
  })
}
</script>

<template>
  <section class="view-page view-transposed-positions">
    <p class="view-subtitle subtitle">
      Where bodies stood at a historic moment, held as fixed points of the zodiac and placed in the sky of another moment and place.
    </p>

    <div class="view-form box horizontal-form">
      <BodySelect v-model="form.bodies" />
      <MomentFields :form="moment" />
      <LocationFields />
      <HistoricFields :form="historic" :hide-place="form.ps !== 'topo'" />
      <b-field label="Perspective" label-position="on-border">
        <b-select size="is-small" v-model="form.ps">
          <option value="topo">Topocentric</option>
          <option value="geo">Geocentric</option>
        </b-select>
      </b-field>
      <b-field>
        <b-checkbox size="is-small" v-model="form.speeds">Show speeds</b-checkbox>
      </b-field>
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          {{ (res as TransposedPositionsResult).ps }} · positions of <UtcTime :value="(res as TransposedPositionsResult).historic_date" /> in the sky of
          <UtcTime :value="(res as TransposedPositionsResult).date" /> · tropical longitude · angles in degrees, speeds in °/day
        </p>
        <PointsList v-if="(res as TransposedPositionsResult).points" :points="(res as TransposedPositionsResult).points!" title="Points at the moment" />
        <PointsList v-if="(res as TransposedPositionsResult).historic_points" :points="(res as TransposedPositionsResult).historic_points!" title="Historic points" />
        <b-table :data="rows" striped narrowed scrollable>
          <b-table-column field="source" label="Source body" v-slot="props"><BodyKey :value="props.row.source" /></b-table-column>
          <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
          <b-table-column field="lat" label="Latitude" numeric v-slot="props">{{ round(props.row.lat) }}</b-table-column>
          <b-table-column field="ras" label="Right asc." numeric v-slot="props">{{ round(props.row.ras) }}</b-table-column>
          <b-table-column field="dcl" label="Declination" numeric v-slot="props">{{ round(props.row.dcl) }}</b-table-column>
          <b-table-column field="azi" label="Azimuth" numeric v-slot="props">{{ round(props.row.azi) }}</b-table-column>
          <b-table-column field="alt" label="Altitude" numeric v-slot="props">{{ round(props.row.alt) }}</b-table-column>
          <b-table-column field="azi_speed" label="Azi speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.azi_speed) }}</b-table-column>
          <b-table-column field="alt_speed" label="Alt speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.alt_speed) }}</b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
