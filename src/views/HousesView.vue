<script setup lang="ts">
import RunButton from '../components/RunButton.vue'
import { computed, reactive, watch } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useAyanamshaKey, useMomentForm } from '../lib/queryForms'
import { ayanamshaLabel } from '../lib/zodiac'
import { fullHouseName, shortHouseName } from '../lib/houses'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import AyanamshaSelect from '../components/AyanamshaSelect.vue'
import AyanamshaList from '../components/AyanamshaList.vue'
import PointsList from '../components/PointsList.vue'
import HouseSystemSelect from '../components/HouseSystemSelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { useReferenceStore } from '../stores/reference'
import { usePreferencesStore } from '../stores/preferences'
import type { Angles, AyanamshaValue, GeoJson, HouseSet } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()
// The shared choice: '' for tropical cusps.
const aya = useAyanamshaKey()
const reference = useReferenceStore()
/** The API's letter for the Gauquelin sectors. */
const GAUQUELIN = 'G'
const systems = reactive({ codes: [] as string[] })
// Every twelve-house system is selected to begin with, once the list has come from the API.
// The 36 Gauquelin sectors are on offer but left out: they triple the height of the table.
const stop = watch(
  () => reference.houseSystems,
  (list) => {
    if (!list.length) return
    if (!systems.codes.length) systems.codes = list.map((h) => h.code).filter((code) => code !== GAUQUELIN)
    queueMicrotask(() => stop())
  },
  { immediate: true },
)

interface HousesResult {
  date: unknown
  geo: GeoJson
  sidereal: boolean
  ayanamsha: AyanamshaValue | null
  angles: Angles
  sets: HouseSet[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<HousesResult>('/houses')

/** The ayanamsha of the result on screen, or null when its cusps are tropical. */
const applied = computed<AyanamshaValue | null>(() => (data.value?.sidereal ? (data.value.ayanamsha ?? null) : null))

/** Columns of the table: 12, or 36 when the Gauquelin sectors are among the sets. */
const cuspCount = computed(() => Math.max(12, ...(data.value?.sets ?? []).map((set) => set.cusps.length)))

/** The systems that are undefined at this latitude, shown as another. */
const fallbacks = computed(() => (data.value?.sets ?? []).filter((set) => set.fallback))

function systemName(code: string): string {
  return reference.houseSystems.find((h) => h.code === code)?.name ?? code
}

function submit() {
  // With `aya` the API returns sidereal cusps; the angles stay tropical.
  run({ ...momentParams(moment), loc: prefs.loc, hsys: systems.codes, aya: aya.value || undefined })
}
</script>

<template>
  <section class="view-page view-houses">
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <LocationFields />
    <HouseSystemSelect v-model="systems.codes" />
    <AyanamshaSelect v-model="aya" />
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <PointsList :points="(res as HousesResult).angles" :ayanamsha="applied" />
      <AyanamshaList :ayanamshas="applied ? [applied] : []" />
      <p class="result-summary">Cusps are {{ applied ? `sidereal (${ayanamshaLabel(applied.name)})` : 'tropical' }}</p>
      <!-- A row per system and a column per cusp: twelve fit the page, and the 36 Gauquelin sectors scroll sideways. -->
      <b-table :data="(res as HousesResult).sets" striped narrowed class="houses-table" :class="{ 'is-wide': cuspCount > 12 }">
        <b-table-column field="name" label="System" sticky v-slot="props">
          <b-tooltip
            :label="`${fullHouseName(props.row)} (${props.row.cusps.length} houses)${props.row.fallback ? ` · not defined here: ${systemName(props.row.fallback)} used` : ''}`"
            position="is-right"
            dashed
            class="houses-table-system"
          >
            {{ shortHouseName(props.row) }}<span v-if="props.row.fallback" class="houses-table-fallback">*</span>
          </b-tooltip>
        </b-table-column>
        <b-table-column v-for="i in cuspCount" :key="i" :field="`cusp${i}`" :label="`${i}`" v-slot="props">
          <DegreeValue
            v-if="props.row.cusps[i - 1] !== undefined"
            :value="props.row.cusps[i - 1]"
            mode="dms"
            tooltip="sign"
            :prefix="`${i}/${props.row.cusps.length}`"
            :ayanamsha="applied ? ayanamshaLabel(applied.name) : null"
          />
        </b-table-column>
      </b-table>
      <p v-if="fallbacks.length" class="result-summary houses-table-note">
        * Not defined at this latitude:
        <template v-for="(set, i) in fallbacks" :key="set.system">{{ i ? ', ' : '' }}{{ set.name }} is shown as {{ systemName(set.fallback!) }}</template>
      </p>
    </template>
  </ResultPanel>
  </section>
</template>
