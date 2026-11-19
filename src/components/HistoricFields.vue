<script setup lang="ts">
import { dateTimeStringToJul, julToIsoDateTime } from '../lib/julian-date'
import type { HistoricChoice } from '../stores/preferences'
import PlaceSearch from './PlaceSearch.vue'
import LocalTimeField from './LocalTimeField.vue'

/** The historic (source) moment of transposed points and, in the topocentric view, its place. */
const props = defineProps<{ form: HistoricChoice; hidePlace?: boolean }>()

/** Carries the moment across when the mode changes, as the target moment's fields do. */
function changeMode(mode: HistoricChoice['mode']) {
  const form = props.form
  const jd = form.mode === 'jd' ? form.jd : dateTimeStringToJul(form.dt)
  if (jd !== null && Number.isFinite(jd)) {
    if (mode === 'dt') form.dt = julToIsoDateTime(jd)
    if (mode === 'jd') form.jd = Number(jd.toFixed(6))
  }
  form.mode = mode
}
</script>

<template>
  <b-field class="historic-fields moment-fields" size="is-small" label="Historic moment" grouped group-multiline>
    <b-field class="moment-mode" label="Moment" label-position="on-border">
      <b-select :model-value="form.mode" size="is-small" @update:model-value="changeMode">
        <option value="dt">Date / time</option>
        <option value="jd">Julian Day</option>
      </b-select>
    </b-field>
    <b-field v-if="form.mode === 'dt'" label="Date-time (UTC)" label-position="on-border" title="Read as UTC (Universal Time), not local time">
      <b-input size="is-small" v-model="form.dt" type="datetime-local" step="1" />
    </b-field>
    <LocalTimeField v-if="form.mode === 'dt' && !hidePlace" :target="form" :form="form" />
    <b-field v-else-if="form.mode === 'jd'" label="Julian Day (UT)" label-position="on-border">
      <b-numberinput size="is-small" v-model="form.jd" :step="0.5" :controls="false" />
    </b-field>
  </b-field>
  <b-field v-if="!hidePlace" class="historic-fields location-fields" label="Historic location" size="is-small" grouped group-multiline>
    <PlaceSearch :target="form" :moment="form" />
    <b-field label="Latitude" label-position="on-border">
      <b-numberinput v-model="form.lat" :step="0.0001" :min="-90" :max="90" :controls="false" size="is-small" />
    </b-field>
    <b-field label="Longitude" label-position="on-border">
      <b-numberinput v-model="form.lng" :step="0.0001" :min="-180" :max="180" :controls="false" size="is-small" />
    </b-field>
    <b-field class="location-altitude" label="Altitude (m)" label-position="on-border">
      <b-numberinput v-model="form.alt" :step="1" :controls="false" size="is-small" />
    </b-field>
  </b-field>
</template>
