<script setup lang="ts">
import PerspectiveSelect from '../components/PerspectiveSelect.vue'
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '../stores/preferences'
import { useReferenceStore } from '../stores/reference'

const prefs = usePreferencesStore()
const { apiBase, cs, ps, defaultOrb } = storeToRefs(prefs)

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
  <section class="view-page view-settings">
    <p class="view-subtitle subtitle">Preferences are saved to this browser's local storage.</p>

    <div class="settings-form view-form box">
      <div class="columns is-multiline">
        <div class="column is-full">
          <b-field horizontal label="API base URL">
            <b-input v-model="apiBase" placeholder="https://astrocalc.multifaceted.info" size="is-small" />
          </b-field>
        </div>
        <div class="column is-half">
          <b-field horizontal label="Default orb (°)">
            <b-numberinput v-model="defaultOrb" :step="0.5" :min="0.1" :controls="false" size="is-small" />
          </b-field>
        </div>
        <div class="column is-half">
          <b-field horizontal label="Coord. system">
            <b-select v-model="cs" size="is-small" expanded>
              <option value="ecl">Ecliptic</option>
              <option value="equ">Equatorial</option>
              <option value="hor">Horizontal</option>
            </b-select>
          </b-field>
        </div>
        <div class="column is-half">
          <PerspectiveSelect v-model="ps" horizontal />
        </div>
      </div>

      <div class="settings-actions buttons mt-2">
        <b-button @click="reload" :loading="referenceLoading" size="is-small">Reload reference data</b-button>
        <b-button type="is-danger" outlined @click="resetPreferences" size="is-small">Reset preferences</b-button>
      </div>
      <b-notification v-if="referenceError" type="is-danger" :closable="false">{{ referenceError }}</b-notification>
    </div>
  </section>
</template>
