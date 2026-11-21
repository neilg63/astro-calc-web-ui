<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import { useReferenceStore } from '../stores/reference'
import { ayanamshaLabel } from '../lib/zodiac'
import { formatFullDms } from '../lib/degrees'
import { round } from '../lib/format'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import BodySelect from '../components/BodySelect.vue'
import BodyKey from '../components/BodyKey.vue'
import DegreeValue from '../components/DegreeValue.vue'
import RunButton from '../components/RunButton.vue'
import ResultPanel from '../components/ResultPanel.vue'
import type { AyanamshaValue, GeoJson, Moment, NakshatraEntry } from '../api/types'

const prefs = usePreferencesStore()
const reference = useReferenceStore()
const moment = useMomentForm()

onMounted(() => reference.loadAll())

/** The API's own default for nakshatras, used until another ayanamsha is chosen. */
const DEFAULT_AYANAMSHA = 'tc'

// The Moon alone gives the birth star. The page keeps its own ayanamsha: a nakshatra always
// has one, whatever zodiac the other pages are set to.
const form = reactive({ bodies: ['mo'], aya: prefs.ayanamshas[0] ?? DEFAULT_AYANAMSHA })

interface NakshatraResult {
  date: Moment
  geo: GeoJson | null
  ps: string
  ayanamsha: AyanamshaValue
  /** Degrees in one nakshatra: 13°20′. */
  span: number
  bodies: NakshatraEntry[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<NakshatraResult>('/nakshatra')

const rows = computed<NakshatraEntry[]>(() => data.value?.bodies ?? [])

/** The Moon's row, when the Moon was asked for: the birth star of the moment. */
const moon = computed(() => rows.value.find((row) => row.key === 'mo'))

/** The ascendant is the one point here that needs a place. */
const needsPlace = computed(() => form.bodies.includes('as'))

/** Names the row by its nakshatra (`nakshatra-1` Ashwini to `nakshatra-27` Revati), pada and lord; the Moon's is `is-moon`. */
function rowClass(row: NakshatraEntry): string {
  return `nakshatra-${row.num} pada-${row.pada} lord-${row.lord}${row.key === 'mo' ? ' is-moon' : ''}`
}

function submit() {
  run({
    bodies: form.bodies,
    ...momentParams(moment),
    aya: form.aya,
    loc: needsPlace.value ? prefs.loc : undefined,
  })
}
</script>

<template>
  <section class="view-page view-nakshatras">
    <p class="view-subtitle subtitle">The 27 lunar mansions: 13°20′ divisions of the sidereal zodiac, each of four padas. The Moon's nakshatra at birth is the birth star.</p>

    <div class="view-form box horizontal-form">
      <BodySelect v-model="form.bodies" perspective="geo" />
      <MomentFields :form="moment" />
      <b-field grouped group-multiline>
        <b-field class="ayanamsha-select" label="Ayanamsha" label-position="on-border">
          <b-select v-model="form.aya" size="is-small">
            <option v-for="a in reference.ayanamshas" :key="a.key" :value="a.key">{{ ayanamshaLabel(a.name) }}</option>
          </b-select>
        </b-field>
      </b-field>
      <LocationFields v-if="needsPlace" />
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p v-if="moon" class="nakshatra-moon mb-2">
          Moon in <strong>{{ moon.name }}</strong>, pada {{ moon.pada }} · lord <BodyKey :value="moon.lord" named />
        </p>
        <p class="result-summary">
          geocentric · sidereal ({{ ayanamshaLabel((res as NakshatraResult).ayanamsha.name) }}, {{ round((res as NakshatraResult).ayanamsha.value, 4) }}°)
        </p>
        <b-table class="nakshatras-table" :data="rows" :row-class="rowClass" striped narrowed>
          <b-table-column field="key" label="Body" v-slot="props"><BodyKey :value="props.row.key" named /></b-table-column>
          <b-table-column field="lng" label="Longitude" v-slot="props">
            <DegreeValue :value="props.row.lng" :ayanamsha="ayanamshaLabel((res as NakshatraResult).ayanamsha.name)" />
          </b-table-column>
          <b-table-column field="num" label="#" numeric v-slot="props">{{ props.row.num }}</b-table-column>
          <b-table-column field="name" label="Nakshatra" v-slot="props"><span class="nakshatra-name">{{ props.row.name }}</span></b-table-column>
          <b-table-column field="pada" label="Pada" numeric v-slot="props">{{ props.row.pada }}</b-table-column>
          <b-table-column field="lord" label="Lord" v-slot="props"><BodyKey :value="props.row.lord" named /></b-table-column>
          <b-table-column field="degrees" label="Within" numeric v-slot="props">
            <span class="nakshatra-degrees" :title="`${round(props.row.degrees, 4)}° of ${formatFullDms((res as NakshatraResult).span)}`">{{ formatFullDms(props.row.degrees) }}</span>
          </b-table-column>
          <b-table-column field="fraction" label="Elapsed" numeric v-slot="props">{{ round(props.row.fraction * 100, 2) }}%</b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
