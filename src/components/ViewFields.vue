<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type { ViewForm } from '../lib/queryForms'
import { perspective, type PerspectiveKey } from '../lib/perspectives'
import LocationFields from './LocationFields.vue'
import PerspectiveSelect from './PerspectiveSelect.vue'

const props = defineProps<{
  form: ViewForm
  locationRequired?: boolean
  hideCs?: boolean
  /** The perspectives this endpoint accepts; all of them by default. */
  perspectives?: PerspectiveKey[]
}>()

const ps = computed(() => perspective(props.form.ps))
const needsLocation = computed(() => props.locationRequired || ps.value.needsLocation)

// Horizontal coordinates need an observer on the Earth.
watchEffect(() => {
  if (!ps.value.earth && props.form.cs === 'hor') props.form.cs = 'ecl'
})
</script>

<template>
  <div class="view-fields">
    <b-field grouped group-multiline>
      <b-field v-if="!hideCs" label="Coordinate system" label-position="on-border">
        <b-select size="is-small" v-model="props.form.cs" :disabled="props.form.ps === 'local'" :title="props.form.ps === 'local' ? 'Local space is always azimuth and altitude' : undefined">
          <option value="ecl">Ecliptic</option>
          <option value="equ">Equatorial</option>
          <option value="hor" :disabled="!ps.earth">Horizontal</option>
        </b-select>
      </b-field>
      <PerspectiveSelect v-model="props.form.ps" :allow="perspectives" />
      <b-field v-if="ps.earth && !needsLocation">
        <b-checkbox size="is-small" v-model="props.form.useLocation">Use my location</b-checkbox>
      </b-field>
    </b-field>
    <LocationFields v-if="needsLocation || (ps.earth && props.form.useLocation)" />
  </div>
</template>
