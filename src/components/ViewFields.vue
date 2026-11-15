<script setup lang="ts">
import type { ViewForm } from '../lib/queryForms'
import LocationFields from './LocationFields.vue'

const props = defineProps<{ form: ViewForm; locationRequired?: boolean; hideCs?: boolean }>()
</script>

<template>
  <div class="view-fields">
    <b-field grouped group-multiline>
      <b-field v-if="!hideCs" label="Coordinate system" label-position="on-border">
        <b-select size="is-small" v-model="props.form.cs">
          <option value="ecl">Ecliptic</option>
          <option value="equ">Equatorial</option>
          <option value="hor">Horizontal</option>
        </b-select>
      </b-field>
      <b-field label="Perspective" label-position="on-border">
        <b-select size="is-small" v-model="props.form.ps">
          <option value="geo">Geocentric</option>
          <option value="topo">Topocentric</option>
        </b-select>
      </b-field>
      <b-field v-if="!locationRequired">
        <b-checkbox size="is-small" v-model="props.form.useLocation">Use my location</b-checkbox>
      </b-field>
    </b-field>
    <LocationFields v-if="locationRequired || props.form.useLocation" />
  </div>
</template>
