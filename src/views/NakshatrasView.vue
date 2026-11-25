<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import { useReferenceStore } from '../stores/reference'
import { ayanamshaLabel } from '../lib/zodiac'
import { formatFullDms } from '../lib/degrees'
import { formatJdSpan, jdToUtc, round } from '../lib/format'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import BodySelect from '../components/BodySelect.vue'
import BodyKey from '../components/BodyKey.vue'
import DegreeValue from '../components/DegreeValue.vue'
import RunButton from '../components/RunButton.vue'
import ResultPanel from '../components/ResultPanel.vue'
import UtcTime from '../components/UtcTime.vue'
import type { AyanamshaValue, GeoJson, Moment, NakshatraEntry } from '../api/types'

const prefs = usePreferencesStore()
const reference = useReferenceStore()
const moment = useMomentForm()

onMounted(() => reference.loadAll())

/** The API's own default for nakshatras, used until another ayanamsha is chosen. */
const DEFAULT_AYANAMSHA = 'tc'

/** The nine grahas, in their traditional order: each has a nakshatra, the Moon's being the birth star. */
const GRAHAS = ['su', 'mo', 'ma', 'me', 'ju', 've', 'sa', 'ra', 'ke']

// The page keeps its own ayanamsha: a nakshatra always has one, whatever zodiac the other
// pages are set to.
const form = reactive({ bodies: [...GRAHAS], aya: prefs.ayanamshas[0] ?? DEFAULT_AYANAMSHA })

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

/** What a duration says on hover: the same in days, and the moment the body leaves the nakshatra. */
function durationTooltip(row: NakshatraEntry): string {
  if (row.start_jd == null || row.end_jd == null) return ''
  return `${round(row.end_jd - row.start_jd, 3)} days · leaves ${jdToUtc(row.end_jd)} UTC`
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
    <p class="view-subtitle subtitle">The 27 lunar mansions: 13°20′ divisions of the sidereal zodiac, each of four padas. Every graha has one, with the time it entered and how long it stays; the Moon's at birth is the birth star.</p>

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
          <template v-if="moon.start_jd != null && moon.end_jd != null"> · entered <UtcTime :value="moon.start_jd" /> for {{ formatJdSpan(moon.start_jd, moon.end_jd) }}</template>
        </p>
        <p class="result-summary">
          geocentric · sidereal ({{ ayanamshaLabel((res as NakshatraResult).ayanamsha.name) }}, {{ round((res as NakshatraResult).ayanamsha.value, 4) }}°)
        </p>
        <b-table class="nakshatras-table" :data="rows" :row-class="rowClass" striped narrowed>
          <b-table-column field="key" label="Body" v-slot="props"><BodyKey :value="props.row.key" /></b-table-column>
          <b-table-column field="lng" label="Longitude" v-slot="props">
            <DegreeValue :value="props.row.lng" :ayanamsha="ayanamshaLabel((res as NakshatraResult).ayanamsha.name)" />
          </b-table-column>
          <b-table-column field="num" label="#" numeric v-slot="props">{{ props.row.num }}</b-table-column>
          <b-table-column field="name" label="Nakshatra" v-slot="props"><span class="nakshatra-name">{{ props.row.name }}</span></b-table-column>
          <b-table-column field="pada" label="Pada" numeric v-slot="props">{{ props.row.pada }}</b-table-column>
          <b-table-column field="lord" label="Lord" v-slot="props"><BodyKey :value="props.row.lord" /></b-table-column>
          <b-table-column field="degrees" label="Within" numeric v-slot="props">
            <span class="nakshatra-degrees" :title="`${round(props.row.degrees, 4)}° of ${formatFullDms((res as NakshatraResult).span)}`">{{ formatFullDms(props.row.degrees) }}</span>
          </b-table-column>
          <b-table-column field="fraction" label="Elapsed" numeric v-slot="props">{{ round(props.row.fraction * 100, 2) }}%</b-table-column>
          <b-table-column field="start_jd" label="Entered" v-slot="props">
            <UtcTime v-if="props.row.start_jd != null" class="nakshatra-start" :value="props.row.start_jd" />
            <span v-else class="nakshatra-start is-unknown">—</span>
          </b-table-column>
          <b-table-column field="end_jd" label="Duration" numeric v-slot="props">
            <b-tooltip v-if="props.row.start_jd != null && props.row.end_jd != null" class="nakshatra-duration" :label="durationTooltip(props.row)" position="is-top" dashed>
              {{ formatJdSpan(props.row.start_jd, props.row.end_jd) }}
            </b-tooltip>
            <span v-else class="nakshatra-duration is-unknown">—</span>
          </b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
