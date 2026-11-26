<script setup lang="ts">
import RunButton from '../components/RunButton.vue'
import { computed } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { usePreferencesStore } from '../stores/preferences'
import { useTimeBasis } from '../lib/timeBasis'
import { formatDuration, formatDurationWords, formatPercent, round } from '../lib/format'
import type { GeoJson, Moment } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()
const basis = useTimeBasis()

interface IndianDayResult {
  date: unknown
  geo: GeoJson
  rise: Moment
  set: Moment
  next_rise: Moment
  kind: string
  is_day_time: boolean
  day_length: number
  daylight_length: number
  night_length: number
  progress: number
  muhurta: number
  ghati: number
  vighati: number
  lipta: number
  half_day_muhurta: number
  weekday: number
  display: string
}

const { data, error, loading, run, lastUrl } = useEndpoint<IndianDayResult>('/indian-day')

/** The API's day kinds in plain words; an unknown kind shows as it came. */
const KIND_LABELS: Record<string, string> = {
  Normal: 'Ordinary day (the Sun rises and sets)',
  PolarDay: 'Midnight sun (no sunrise or sunset; bounded by lower meridian transits)',
  PolarNight: 'Polar night (no sunrise or sunset; bounded by upper meridian transits)',
}

/** One Indian time unit in the table: its name, value and the tooltip explaining it. */
interface UnitPart {
  name: string
  /** Names the unit in class names: `ghati` gives `.indian-day-ghati`. */
  slug: string
  /** The whole number, and any decimal places with their point (`.855`), shown smaller. */
  whole: string
  decimals: string
  hint: string
}

interface DayRow {
  key: string
  value: unknown
  duration: string
  hint: string
  parts: UnitPart[]
  /** What stands between the parts of a combined row. */
  separator?: string
  /** Day or night, shown as a symbol before the value. */
  phase?: 'day' | 'night'
}

const rows = computed<DayRow[]>(() => {
  const res = data.value
  if (!res) return []
  const row = (key: string, value: unknown, duration: number | null = null, hint = '', parts: UnitPart[] = []): DayRow => ({
    key,
    value,
    duration: duration === null ? '' : formatDuration(duration),
    hint,
    parts,
  })
  const split = (value: number, places = 0) => {
    const [whole = '', decimals = ''] = (places ? round(value, places) : String(Math.round(value))).split('.')
    return { whole, decimals: decimals ? `.${decimals}` : '' }
  }
  // Each unit is a fixed share of this sunrise-to-sunrise day, so its length follows the day's.
  const unit = (name: string, also: string, value: number, perDay: number, places = 0): UnitPart => ({
    name,
    slug: name.toLowerCase(),
    ...split(value, places),
    hint: `${name}${also ? ` (also ${also})` : ''} · 1/${perDay.toLocaleString('en')} of the day · ${formatDurationWords(res.day_length / perDay, true)}`,
  })
  const muhurta = unit('Muhurta', '', res.muhurta, 30)
  // Where the Sun neither rises nor sets, the day runs between two of its meridian transits:
  // there is no sunrise or sunset to show, so the rows say what the bounds really are.
  // Names what the times beside these labels are, following the "Show times as" choice.
  const mode = basis.mode.value
  const zone = mode === 'jd' ? 'Julian Day' : mode === 'local' ? `local, ${basis.offsetLabel.value}` : 'UTC'
  const transit = res.kind === 'PolarDay' ? 'lower' : res.kind === 'PolarNight' ? 'upper' : ''
  const bounds = transit
    ? [
        row(`Day begins (Sun's ${transit} meridian transit, ${zone})`, res.rise),
        row('Sunrise / sunset', res.kind === 'PolarDay' ? 'None: the Sun stays above the horizon' : 'None: the Sun stays below the horizon'),
        row(`Day ends (next ${transit} meridian transit, ${zone})`, res.next_rise),
      ]
    : [row(`Sunrise (${zone})`, res.rise), row(`Sunset (${zone})`, res.set), row(`Next sunrise (${zone})`, res.next_rise)]
  return [
    {
      ...row('', '', null, '', [
        unit('Ghati', 'Danda', res.ghati, 60),
        unit('Vighati', 'Pala', res.vighati, 3600),
        unit('Lipta', 'Vipala', res.lipta, 216000, 3),
      ]),
      phase: res.is_day_time ? 'day' : 'night',
    },
    {
      ...row('', '', null, '', [
        muhurta,
        {
          name: 'Half-day muhurta',
          slug: 'half-day-muhurta',
          ...split(res.half_day_muhurta),
          hint: `Half-day muhurta · 1/15 of the ${res.is_day_time ? 'daylight' : 'night'} · ${formatDurationWords((res.is_day_time ? res.daylight_length : res.night_length) / 15, true)}`,
        },
      ]),
      separator: '/',
    },
    row('Progress', formatPercent(res.progress), res.progress * res.day_length),
    row('Kind', `${res.is_day_time ? 'Daytime' : 'Nighttime'} / ${KIND_LABELS[res.kind] ?? res.kind}`),
    ...bounds,
    row('Day length (days)', round(res.day_length, 5), res.day_length),
    row('Daylight length (days)', round(res.daylight_length, 5), res.daylight_length),
    row('Night length (days)', round(res.night_length, 5), res.night_length),
    row('Weekday', res.weekday),
  ]
})

function submit() {
  run({ ...momentParams(moment), loc: prefs.loc })
}
</script>

<template>
  <section class="view-page view-indian-day">
  <p class="view-subtitle subtitle">The sunrise-to-sunrise day containing the date, with ghati/vighati time units.</p>

  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <LocationFields />
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default>
      <b-table :data="rows" striped narrowed>
        <b-table-column field="key" label="Field" v-slot="props">
          <span v-if="props.row.parts.length" class="indian-day-units">
            <template v-for="(part, index) in props.row.parts" :key="part.name">
              <span v-if="index" class="indian-day-separator">{{ props.row.separator ?? ':' }}</span>
              <b-tooltip class="indian-day-unit" :label="part.hint" position="is-right">{{ part.name }}</b-tooltip>
            </template>
          </span>
          <b-tooltip v-else-if="props.row.hint" class="indian-day-unit" :label="props.row.hint" position="is-right">{{ props.row.key }}</b-tooltip>
          <template v-else>{{ props.row.key }}</template>
        </b-table-column>
        <b-table-column field="value" label="Value" v-slot="props">
          <span v-if="props.row.parts.length" class="indian-day-units">
            <b-tooltip v-if="props.row.phase" class="indian-day-phase" :class="`is-${props.row.phase}`" :label="props.row.phase === 'day' ? 'Daytime' : 'Night-time'">{{ props.row.phase === 'day' ? '☀︎' : '☾' }}</b-tooltip>
            <template v-for="(part, index) in props.row.parts" :key="part.name">
              <span v-if="index" class="indian-day-separator">{{ props.row.separator ?? ':' }}</span>
              <b-tooltip class="indian-day-unit-value" :label="part.hint">
                <span class="indian-day-unit-number" :class="`indian-day-${part.slug}`">
                  <span :class="`indian-day-${part.slug}-whole`">{{ part.whole }}</span><span v-if="part.decimals" :class="`indian-day-${part.slug}-decimals`">{{ part.decimals }}</span>
                </span>
              </b-tooltip>
            </template>
          </span>
          <UtcTime v-else-if="typeof props.row.value === 'object'" :value="props.row.value" />
          <template v-else>{{ props.row.value }}</template>
        </b-table-column>
        <b-table-column field="duration" label="Duration" numeric cell-class="indian-day-duration" v-slot="props">{{ props.row.duration }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
