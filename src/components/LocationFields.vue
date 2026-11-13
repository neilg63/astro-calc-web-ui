<script setup lang="ts">
import { usePreferencesStore } from '../stores/preferences'

const prefs = usePreferencesStore()
</script>

<template>
  <b-field label="Location" grouped group-multiline>
    <b-field label="Latitude" label-position="on-border">
      <b-numberinput v-model="prefs.lat" :step="0.0001" :min="-90" :max="90" :controls="false" />
    </b-field>
    <b-field label="Longitude" label-position="on-border">
      <b-numberinput v-model="prefs.lng" :step="0.0001" :min="-180" :max="180" :controls="false" />
    </b-field>
    <b-field label="Altitude (m)" label-position="on-border">
      <b-numberinput v-model="prefs.alt" :step="1" :controls="false" />
    </b-field>
  </b-field>
</template>
