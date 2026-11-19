<script setup lang="ts">
import { usePreferencesStore } from '../stores/preferences'
import PlaceSearch from './PlaceSearch.vue'

const prefs = usePreferencesStore()
</script>

<template>
  <b-field class="location-fields" label="Location" size="is-small" grouped group-multiline>
    <PlaceSearch :target="prefs" :moment="prefs.moment" />
    <b-field label="Latitude" label-position="on-border">
      <b-numberinput v-model="prefs.lat" :step="0.0001" :min="-90" :max="90" :controls="false" size="is-small" />
    </b-field>
    <b-field label="Longitude" label-position="on-border">
      <b-numberinput v-model="prefs.lng" :step="0.0001" :min="-180" :max="180" :controls="false" size="is-small" />
    </b-field>
    <b-field class="location-altitude" label="Altitude (m)" label-position="on-border">
      <b-numberinput v-model="prefs.alt" :step="1" :controls="false" size="is-small" />
    </b-field>
  </b-field>
</template>
