<script setup lang="ts">
import { withBodySymbol } from '../lib/bodies'
import RunButton from '../components/RunButton.vue'
import { reactive, ref, watch } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { useReferenceStore } from '../stores/reference'
import { historicParams, momentParams, useHistoricForm, useMomentForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import { TRANSPOSED_BODY_KEYS, type TransposedPerspective } from '../lib/transposed'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import HistoricFields from '../components/HistoricFields.vue'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import PointsTable from '../components/PointsTable.vue'
import UtcTime from '../components/UtcTime.vue'
import { round } from '../lib/format'
import type { RiseSetDay, TransposedHead, TransposedTransitsForBody } from '../api/types'

const reference = useReferenceStore()
const prefs = usePreferencesStore()
const moment = useMomentForm()
const historic = useHistoricForm()
const form = reactive({
  bodies: [...TRANSPOSED_BODY_KEYS],
  ps: 'topo' as TransposedPerspective,
  days: 1,
  pdays: 0,
})

interface TransposedTransitsResult extends TransposedHead {
  days: number
  pdays: number
  horizon_alt: number
  bodies: TransposedTransitsForBody[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<TransposedTransitsResult>('/transposed-transits')
const activeTab = ref(0)
watch(data, (res) => {
  if (activeTab.value >= (res?.bodies.length ?? 0)) activeTab.value = 0
})

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

/** Why a day has neither a rise nor a set: the point stays above or below the horizon. */
function dayNote(day: RiseSetDay): string {
  if (day.rise !== null || day.set !== null) return ''
  if (day.alt_min > 0) return 'up all day'
  if (day.alt_max < 0) return 'down all day'
  return ''
}

function submit() {
  run({
    bodies: form.bodies,
    ...momentParams(moment),
    loc: prefs.loc,
    ...historicParams(historic, form.ps === 'topo'),
    ps: form.ps,
    days: form.days,
    pdays: form.pdays,
  })
}
</script>

<template>
  <section class="view-page view-transposed-transits">
    <p class="view-subtitle subtitle">
      Rise, set and meridian transits of the points where bodies stood at a historic moment, for each local day at another place.
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
      <b-field label="Days" grouped group-multiline>
        <b-field label="Before" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.pdays" :min="0" :step="1" :controls="false" />
        </b-field>
        <b-field label="After" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.days" :min="0" :step="1" :controls="false" />
        </b-field>
      </b-field>
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          {{ (res as TransposedTransitsResult).ps }} · positions of <UtcTime :value="(res as TransposedTransitsResult).historic_date" /> ·
          horizon: {{ round((res as TransposedTransitsResult).horizon_alt, 2) }}°
        </p>
        <b-tabs v-model="activeTab" size="is-small" :animated="false" class="rise-sets-tabs">
          <b-tab-item v-for="body in (res as TransposedTransitsResult).bodies" :key="body.key" :label="withBodySymbol(body.source, bodyName(body.source))">
            <p class="result-summary">
              Longitude <DegreeValue :value="body.lng" /> · latitude {{ round(body.lat) }}°
            </p>
            <b-table :data="body.days" striped narrowed class="jd-table">
              <b-table-column field="day_start" label="Day start" v-slot="props"><UtcTime :value="props.row.day_start" /></b-table-column>
              <b-table-column field="rise" label="Rise" v-slot="props"><UtcTime :value="props.row.rise" /></b-table-column>
              <b-table-column field="mc" label="MC (upper transit)" v-slot="props"><UtcTime :value="props.row.mc" /></b-table-column>
              <b-table-column field="set" label="Set" v-slot="props"><UtcTime :value="props.row.set" /></b-table-column>
              <b-table-column field="ic" label="IC (lower transit)" v-slot="props"><UtcTime :value="props.row.ic" /></b-table-column>
              <b-table-column field="alt_min" label="Alt min" numeric v-slot="props">{{ round(props.row.alt_min, 3) }}°</b-table-column>
              <b-table-column field="alt_max" label="Alt max" numeric v-slot="props">{{ round(props.row.alt_max, 3) }}°</b-table-column>
              <b-table-column label="Note" v-slot="props">
                <b-tag v-if="dayNote(props.row)" size="is-small" :type="props.row.alt_min > 0 ? 'is-warning' : 'is-dark'">{{ dayNote(props.row) }}</b-tag>
              </b-table-column>
            </b-table>
          </b-tab-item>
        </b-tabs>
        <div v-if="(res as TransposedTransitsResult).points" class="points-columns">
          <PointsTable :points="(res as TransposedTransitsResult).points!" title="Points at the moment" />
          <PointsTable v-if="(res as TransposedTransitsResult).historic_points" :points="(res as TransposedTransitsResult).historic_points!" title="Historic points" />
        </div>
      </template>
    </ResultPanel>
  </section>
</template>
