<script setup lang="ts">
import type { MomentForm } from '../lib/queryForms'

defineProps<{ form: MomentForm; label?: string }>()
</script>

<template>
  <b-field class="moment-fields"  size="is-small" :label="label ?? 'Moment'" grouped group-multiline>

      <b-select v-model="form.mode" size="is-small">
        <option value="now">Now</option>
        <option value="dt">Date / time</option>
        <option value="jd">Julian Day</option>
      </b-select>
    
    <template v-if="form.mode === 'dt'">
      <b-field label="Local date-time" label-position="on-border">
        <b-input v-model="form.dt" type="datetime-local" step="1" />
      </b-field>
      <b-field label="UTC offset (h)" label-position="on-border">
        <b-numberinput v-model="form.tzoh" :step="0.5" :min="-14" :max="14" :controls="false" />
      </b-field>
    </template>
    <b-field v-else-if="form.mode === 'jd'" label="Julian Day (UT)" label-position="on-border">
      <b-numberinput v-model="form.jd" :step="0.5" :controls="false" />
    </b-field>
  </b-field>
</template>
