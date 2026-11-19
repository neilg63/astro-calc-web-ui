<script setup lang="ts">
import { withBodySymbol } from '../lib/bodies'
import RunButton from '../components/RunButton.vue'
import { reactive, ref, watch } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { useReferenceStore } from '../stores/reference'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import BodySelect from '../components/BodySelect.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { usePreferencesStore } from '../stores/preferences'
import { round } from '../lib/format'
import type { GeoJson, RiseSetDay, RiseSetDaysForBody, RiseSetOptionsJson } from '../api/types'

const reference = useReferenceStore()
const prefs = usePreferencesStore()
const moment = useMomentForm()
const form = reactive({
  bodies: ['su', 'mo'],
  days: 8,
  pdays: 1,
  disc: '',
  refraction: '',
  twilight: '',
  hindu: false,
})

interface RiseSetsResult {
  date: unknown
  geo: GeoJson
  days: number
  pdays: number
  options: RiseSetOptionsJson
  bodies: RiseSetDaysForBody[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<RiseSetsResult>('/rise-sets')
const activeTab = ref(0)
watch(data, (res) => {
  if (activeTab.value >= (res?.bodies.length ?? 0)) activeTab.value = 0
})

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

/**
 * Why a day has neither a rise nor a set (polar regions): the body stays above or below the
 * horizon. Judged from the altitudes at the two meridian transits, which are always given.
 */
function dayNote(day: RiseSetDay): string {
  if (day.rise !== null || day.set !== null) return ''
  if (day.alt_min > 0) return 'up all day'
  if (day.alt_max < 0) return 'down all day'
  return ''
}

function optionsSummary(o: RiseSetOptionsJson): string {
  const parts = o.twilight
    ? [`${o.twilight} twilight`]
    : [`disc: ${o.disc}`, `refraction: ${o.refraction ? 'on' : 'off'}`, `horizon: ${round(o.horizon, 2)}°`]
  if (o.fixed) parts.push('fixed radius')
  if (o.dip) parts.push('dip')
  if (o.geocentric) parts.push('geocentric')
  if (o.ignore_latitude) parts.push('no latitude')
  return parts.join(' · ')
}

function submit() {
  run({
    bodies: form.bodies,
    ...momentParams(moment),
    loc: prefs.loc,
    days: form.days,
    pdays: form.pdays,
    disc: form.disc,
    refraction: form.refraction,
    twilight: form.twilight,
    hindu: form.hindu ? 1 : undefined,
  })
}
</script>

<template>
  <section class="view-page view-rise-sets">
    <p class="view-subtitle subtitle">Rise, set and meridian transits for each local day, with the altitude range. All times are UTC.</p>

    <div class="view-form box horizontal-form">
      <BodySelect v-model="form.bodies" />
      <MomentFields :form="moment" />
      <LocationFields />
      <b-field label="Days" grouped group-multiline>
        <b-field label="Before" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.pdays" :min="0" :step="1" :controls="false" />
        </b-field>
        <b-field label="After" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.days" :min="0" :step="1" :controls="false" />
        </b-field>
      </b-field>
      <b-field label="Disc" label-position="on-border">
        <b-select size="is-small" v-model="form.disc" :disabled="form.hindu">
          <option value="">Default (centre)</option>
          <option value="upper">Upper limb</option>
          <option value="center">Centre</option>
          <option value="lower">Lower limb</option>
        </b-select>
      </b-field>
      <b-field label="Refraction" label-position="on-border">
        <b-select size="is-small" v-model="form.refraction" :disabled="form.hindu">
          <option value="">Default (on)</option>
          <option value="1">On</option>
          <option value="0">Off</option>
        </b-select>
      </b-field>
      <b-field label="Twilight" label-position="on-border">
        <b-select size="is-small" v-model="form.twilight">
          <option value="">None (horizon)</option>
          <option value="civil">Civil (−6°)</option>
          <option value="nautical">Nautical (−12°)</option>
          <option value="astronomical">Astronomical (−18°)</option>
        </b-select>
      </b-field>
      <b-field>
        <b-checkbox size="is-small" v-model="form.hindu">Hindu rising</b-checkbox>
      </b-field>
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">{{ optionsSummary((res as RiseSetsResult).options) }}</p>
        <b-tabs v-model="activeTab" size="is-small" :animated="false" class="rise-sets-tabs">
          <b-tab-item v-for="body in (res as RiseSetsResult).bodies" :key="body.key" :label="withBodySymbol(body.key, bodyName(body.key))">
            <b-table :data="body.days" striped narrowed class="jd-table">
              <b-table-column field="day_start" label="Day start" v-slot="props"><UtcTime :value="props.row.day_start" /></b-table-column>
              <b-table-column field="rise" label="Rise" v-slot="props"><UtcTime :value="props.row.rise" /></b-table-column>
              <b-table-column field="mc" label="MC (upper transit)" v-slot="props"><UtcTime :value="props.row.mc" /></b-table-column>
              <b-table-column field="set" label="Set" v-slot="props"><UtcTime :value="props.row.set" /></b-table-column>
              <b-table-column field="ic" label="IC (lower transit)" v-slot="props"><UtcTime :value="props.row.ic" /></b-table-column>
              <b-table-column field="alt_min" label="Alt min" numeric v-slot="props">{{ round(props.row.alt_min, 3) }}°</b-table-column>
              <b-table-column field="alt_max" label="Alt max" numeric v-slot="props">{{ round(props.row.alt_max, 3) }}°</b-table-column>
              <b-table-column label="Note" v-slot="props">
                <b-tag v-if="dayNote(props.row)" size="is-small" :type="props.row.alt_min > 0 ? 'is-warning' : 'is-dark'">{{ dayNote(props.row) }}</b-tag>
              </b-table-column>
            </b-table>
          </b-tab-item>
        </b-tabs>
      </template>
    </ResultPanel>
  </section>
</template>
