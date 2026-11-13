<script setup lang="ts">
import type { RangeEndForm } from '../lib/queryForms'

defineProps<{ form: RangeEndForm; label?: string }>()
</script>

<template>
  <b-field class="range-end-fields" :label="label ?? 'Range end'" grouped group-multiline>
    <b-field>
      <b-select v-model="form.mode">
        <option value="none">Open-ended (use count)</option>
        <option value="days">N days ahead</option>
        <option value="dt2">Date / time</option>
        <option value="jd2">Julian Day</option>
      </b-select>
    </b-field>
    <b-field v-if="form.mode === 'days'" label="Days" label-position="on-border">
      <b-numberinput v-model="form.days" :min="0" :controls="false" />
    </b-field>
    <b-field v-else-if="form.mode === 'dt2'" label="Local date-time" label-position="on-border">
      <b-input v-model="form.dt2" type="datetime-local" step="1" />
    </b-field>
    <b-field v-else-if="form.mode === 'jd2'" label="Julian Day (UT)" label-position="on-border">
      <b-numberinput v-model="form.jd2" :step="0.5" :controls="false" />
    </b-field>
  </b-field>
</template>
