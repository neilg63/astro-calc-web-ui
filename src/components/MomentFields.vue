<script setup lang="ts">
import { currentJulianDay, dateTimeStringToJul, julToIsoDateTime } from '../lib/julian-date'
import type { MomentForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import LocalTimeField from './LocalTimeField.vue'

const props = defineProps<{ form: MomentForm; label?: string }>()
const prefs = usePreferencesStore()

/**
 * Carries the moment across when the mode changes, so switching between date-time and
 * Julian Day shows the same instant, and leaving "Now" starts from the present time.
 */
function changeMode(mode: MomentForm['mode']) {
  const form = props.form
  const jd = form.mode === 'jd' ? form.jd : form.mode === 'dt' ? dateTimeStringToJul(form.dt) : currentJulianDay()
  if (jd !== null && Number.isFinite(jd)) {
    if (mode === 'dt') form.dt = julToIsoDateTime(jd)
    if (mode === 'jd') form.jd = Number(jd.toFixed(6))
  }
  form.mode = mode
}
</script>

<template>
  <b-field class="moment-fields"  size="is-small" :label="label ?? 'Date and time'" grouped group-multiline>

    <b-field class="moment-mode" label="Moment" label-position="on-border">
      <b-select :model-value="form.mode" size="is-small" @update:model-value="changeMode">
        <option value="now">Now</option>
        <option value="dt">Date / time</option>
        <option value="jd">Julian Day</option>
      </b-select>
    </b-field>
    
    <template v-if="form.mode === 'dt'">
      <b-field label="Date-time (UTC)" label-position="on-border" title="Read as UTC (Universal Time), not local time">
        <b-input size="is-small" v-model="form.dt" type="datetime-local" step="1" />
      </b-field>
      <LocalTimeField :target="prefs" :form="form" />
    </template>
    <b-field v-else-if="form.mode === 'jd'" label="Julian Day (UT)" label-position="on-border">
      <b-numberinput size="is-small" v-model="form.jd" :step="0.5" :controls="false" />
    </b-field>
  </b-field>
</template>
