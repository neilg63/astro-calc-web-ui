<script setup lang="ts">
import RunButton from '../components/RunButton.vue'
import { computed, reactive, ref } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { rangeEndParams, useMomentForm, useRangeEndForm } from '../lib/queryForms'
import { currentJulianDay, dateTimeStringToJul } from '../lib/julian-date'
import MomentFields from '../components/MomentFields.vue'
import RangeEndFields from '../components/RangeEndFields.vue'
import LocationFields from '../components/LocationFields.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { usePreferencesStore } from '../stores/preferences'
import { round } from '../lib/format'
import type { MoonPhaseEntry } from '../api/types'

const moment = useMomentForm()
const rangeEnd = useRangeEndForm()
const prefs = usePreferencesStore()
const opts = reactive({ num: 52, ps: 'topo' as 'geo' | 'topo' })

interface MoonPhasesResult {
  date: unknown
  ps: string
  elongation: number
  elongation_speed: number
  waxing: boolean
  phases: MoonPhaseEntry[]
}

/** Symbols and display names of the API's phase names. */
const PHASES: Record<string, { icon: string; label: string }> = {
  New: { icon: '●', label: 'New moon' },
  FirstQuarter: { icon: '☽', label: 'First quarter' },
  Full: { icon: '○', label: 'Full moon' },
  LastQuarter: { icon: '☾', label: 'Last quarter' },
}

/**
 * The listing starts at the latest phase, so it is asked for from this many days before the
 * moment: more than the longest gap between two phases (about 8.3 days).
 */
const LOOKBACK_DAYS = 9
/** Phases the look-back can add ahead of the latest one. */
const LOOKBACK_PHASES = 2

const { data, error, loading, run, lastUrl } = useEndpoint<MoonPhasesResult>('/moon-phases')
/** The Moon at the moment itself: the listing's own summary is for its earlier start. */
const { data: atMoment, run: runAtMoment } = useEndpoint<MoonPhasesResult>('/moon-phases')

/** The moment and count of the listing shown; the count is null when it runs to an end date. */
const listed = ref<{ jd: number; num: number | null } | null>(null)

/** The page's moment as a Julian Day. */
function momentJd(): number {
  const jd = moment.mode === 'jd' ? moment.jd : moment.mode === 'dt' ? dateTimeStringToJul(moment.dt) : null
  return jd !== null && Number.isFinite(jd) ? jd : currentJulianDay()
}

/** The phases from the latest one at the moment onwards. */
const phases = computed<MoonPhaseEntry[]>(() => {
  const all = data.value?.phases ?? []
  const shown = listed.value
  if (!shown) return all
  const latest = all.reduce((found, phase, i) => (phase.jd <= shown.jd ? i : found), 0)
  return all.slice(latest, shown.num === null ? undefined : latest + shown.num)
})

/** Names the row by its phase (`phase-1` new moon to `phase-4` last quarter) and marks the latest one, already past. */
function rowClass(row: MoonPhaseEntry): string {
  return `phase-${row.num}${listed.value && row.jd <= listed.value.jd ? ' is-latest' : ''}`
}

function submit() {
  const at = momentJd()
  const end = rangeEndParams(rangeEnd)
  const openEnded = Object.keys(end).length === 0
  // A span in days is counted from the start, which is now earlier.
  if (typeof end.days === 'number') end.days += LOOKBACK_DAYS
  const place = { ps: opts.ps, loc: opts.ps === 'topo' ? prefs.loc : undefined }
  listed.value = { jd: at, num: openEnded ? opts.num : null }
  const jd6 = (jd: number) => Number(jd.toFixed(6))
  run({ jd: jd6(at - LOOKBACK_DAYS), ...end, num: opts.num + LOOKBACK_PHASES, ...place })
  runAtMoment({ jd: jd6(at), num: 1, ...place })
}
</script>

<template>
  <section class="view-page view-moon-phases">
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <RangeEndFields :form="rangeEnd" />
    <b-field grouped group-multiline>
      <b-field label="Count (when open-ended)" label-position="on-border">
        <b-numberinput size="is-small" v-model="opts.num" :min="1" :max="1000" :controls="false" />
      </b-field>
      <b-field label="Perspective" label-position="on-border">
        <b-select size="is-small" v-model="opts.ps">
          <option value="topo">Topocentric</option>
          <option value="geo">Geocentric</option>
        </b-select>
      </b-field>
    </b-field>
    <LocationFields v-if="opts.ps === 'topo'" />
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default>
      <p v-if="atMoment" class="mb-2">
        Elongation {{ round(atMoment.elongation, 2) }}° ({{ atMoment.waxing ? 'waxing' : 'waning' }}),
        speed {{ round(atMoment.elongation_speed, 4) }}°/day
      </p>
      <b-table :data="phases" :row-class="rowClass" striped narrowed>
        <b-table-column field="phase" label="Phase" v-slot="props">
          <span class="moon-phase" :class="`is-${props.row.num}`">
            <span class="moon-phase-icon">{{ PHASES[props.row.phase]?.icon }}</span>
            {{ PHASES[props.row.phase]?.label ?? props.row.phase }}
          </span>
        </b-table-column>
        <b-table-column field="num" label="#" v-slot="props">{{ props.row.num }}</b-table-column>
        <b-table-column field="utc" label="When" v-slot="props"><UtcTime :value="props.row" /></b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
