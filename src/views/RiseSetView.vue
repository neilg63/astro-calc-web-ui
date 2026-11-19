<script setup lang="ts">
import BodyKey from '../components/BodyKey.vue'
import RunButton from '../components/RunButton.vue'
import { reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import BodySelect from '../components/BodySelect.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { usePreferencesStore } from '../stores/preferences'
import { round } from '../lib/format'
import type { DayTransitsForBody, GeoJson } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()
const bodies = reactive({ keys: ['su', 'mo'] })
const mode = reactive({ value: 0 })

interface RiseSetResult {
  date: unknown
  geo: GeoJson
  bodies: DayTransitsForBody[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<RiseSetResult>('/rise-set')

function submit() {
  run({ bodies: bodies.keys, ...momentParams(moment), loc: prefs.loc, mode: mode.value })
}
</script>

<template>
  <section class="view-page view-rise-set">
  <div class="view-form box horizontal-form">
    <BodySelect v-model="bodies.keys" />
    <MomentFields :form="moment" />
    <LocationFields />
    <b-field label="Mode (disc alignment / refraction)" label-position="on-border">
      <b-numberinput size="is-small" v-model="mode.value" :min="0" :max="7" :controls="false" />
    </b-field>
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="(res as RiseSetResult).bodies" striped narrowed>
        <b-table-column field="key" label="Body" v-slot="props"><BodyKey :value="props.row.key" /></b-table-column>
        <b-table-column field="prev_set" label="Prev set" v-slot="props"><UtcTime :value="props.row.prev_set" /></b-table-column>
        <b-table-column field="rise" label="Rise" v-slot="props"><UtcTime :value="props.row.rise" /></b-table-column>
        <b-table-column field="mc" label="MC" v-slot="props"><UtcTime :value="props.row.mc" /></b-table-column>
        <b-table-column field="set" label="Set" v-slot="props"><UtcTime :value="props.row.set" /></b-table-column>
        <b-table-column field="ic" label="IC" v-slot="props"><UtcTime :value="props.row.ic" /></b-table-column>
        <b-table-column field="next_rise" label="Next rise" v-slot="props"><UtcTime :value="props.row.next_rise" /></b-table-column>
        <b-table-column field="min_alt" label="Min alt" v-slot="props">{{ round(props.row.min_alt) }}</b-table-column>
        <b-table-column field="max_alt" label="Max alt" v-slot="props">{{ round(props.row.max_alt) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
