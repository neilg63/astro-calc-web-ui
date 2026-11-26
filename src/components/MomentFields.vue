<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
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

/** The present time in UTC, to the second: what "Now" stands for, kept ticking while shown. */
const utcNow = () => new Date().toISOString().slice(0, 19).replace('T', ' ')
const now = ref(utcNow())
let ticker: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  ticker = setInterval(() => (now.value = utcNow()), 1000)
})
onUnmounted(() => clearInterval(ticker))
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
      <b-numberinput size="is-small" v-model="form.jd" step="any" :controls="false" />
    </b-field>
    <button v-else type="button" class="moment-now" title="Click to edit this date and time" @click="changeMode('dt')">
      <span class="moment-now-time">{{ now }}</span> <span class="moment-now-zone">UTC</span>
    </button>
  </b-field>
</template>
