<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '../stores/preferences'
import { useReferenceStore } from '../stores/reference'

const prefs = usePreferencesStore()
const { apiBase, tzOffsetHours, cs, ps, defaultOrb } = storeToRefs(prefs)

const reference = useReferenceStore()
const { loading: referenceLoading, error: referenceError } = storeToRefs(reference)

function reload() {
  reference.loadAll(true)
}

function resetPreferences() {
  prefs.resetToDefaults()
}
</script>

<template>
  <h1 class="title">Settings</h1>
  <p class="subtitle">Preferences are saved to this browser's local storage.</p>

  <div class="box">
    <b-field label="API base URL" label-position="on-border">
      <b-input v-model="apiBase" placeholder="https://astrocalc.multifaceted.info" />
    </b-field>
    <b-field label="Default UTC offset (hours)" label-position="on-border">
      <b-numberinput v-model="tzOffsetHours" :step="0.5" :min="-14" :max="14" :controls="false" />
    </b-field>
    <b-field label="Default coordinate system" label-position="on-border">
      <b-select v-model="cs">
        <option value="ecl">Ecliptic</option>
        <option value="equ">Equatorial</option>
        <option value="hor">Horizontal</option>
      </b-select>
    </b-field>
    <b-field label="Default perspective" label-position="on-border">
      <b-select v-model="ps">
        <option value="geo">Geocentric</option>
        <option value="topo">Topocentric</option>
      </b-select>
    </b-field>
    <b-field label="Default orb (degrees)" label-position="on-border">
      <b-numberinput v-model="defaultOrb" :step="0.5" :min="0.1" :controls="false" />
    </b-field>
    <b-field grouped>
      <b-button @click="reload" :loading="referenceLoading">Reload reference data</b-button>
      <b-button type="is-danger" outlined @click="resetPreferences">Reset preferences</b-button>
    </b-field>
    <b-notification v-if="referenceError" type="is-danger" :closable="false">{{ referenceError }}</b-notification>
  </div>
</template>
