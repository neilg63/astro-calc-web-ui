<script setup lang="ts">
import { withBodySymbol } from '../lib/bodies'
import RunButton from '../components/RunButton.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { useMomentForm } from '../lib/queryForms'
import { currentJulianDay, dateTimeStringToJul, julToIsoDateTime } from '../lib/julian-date'
import { useReferenceStore } from '../stores/reference'
import MomentFields from '../components/MomentFields.vue'
import BodySelect from '../components/BodySelect.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { round } from '../lib/format'
import type { Moment, StationsForBody } from '../api/types'

const OUTER_PLANETS = ['me', 've', 'ma', 'ju', 'sa', 'ur', 'ne', 'pl']
const YEAR_DAYS = 365.25
/** The listing starts this many days early for each year ahead, unless a number is typed. */
const DAYS_BEFORE_PER_YEAR = 30
/** The fewest days before, however short the time ahead. */
const MIN_DAYS_BEFORE = 2
/** Where a listing by start date or Julian Day begins until a start is typed. */
const START_DAYS_BEFORE = 60

/** Display names of the API's station types. */
const EVENT_LABELS: Record<string, string> = {
  peak: 'Peak speed',
  'retro-start': 'Retrograde start',
  'retro-peak': 'Peak retrograde',
  'retro-end': 'Retrograde end',
}

const reference = useReferenceStore()
const moment = useMomentForm()
const bodies = reactive({ keys: [...OUTER_PLANETS] })

/**
 * How the listing's range is given. Years or days ahead of the moment, starting some days
 * before it; or from a start date or Julian Day up to the moment.
 */
const listing = reactive({
  mode: 'years' as 'years' | 'days' | 'dt' | 'jd',
  years: 2,
  days: 90,
  /** Days before the moment typed by hand; null follows the rule. */
  before: null as number | null,
  /** A start typed by hand; empty or null is 60 days before the moment. */
  startDt: '',
  startJd: null as number | null,
})

/** The page's moment as a Julian Day. */
function momentJd(): number {
  const jd = moment.mode === 'jd' ? moment.jd : moment.mode === 'dt' ? dateTimeStringToJul(moment.dt) : null
  return jd !== null && Number.isFinite(jd) ? jd : currentJulianDay()
}

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Days ahead of the moment, in the years and days modes. */
const daysAhead = computed(() => {
  const amount = listing.mode === 'years' ? listing.years * YEAR_DAYS : listing.days
  return isNumber(amount) && amount > 0 ? amount : 0
})

/** 30 days for each year ahead, in proportion for part of a year, and never under 2 days. */
const defaultBefore = computed(() => Math.max(MIN_DAYS_BEFORE, (daysAhead.value / YEAR_DAYS) * DAYS_BEFORE_PER_YEAR))

const daysBefore = computed<number | null>({
  get: () => (isNumber(listing.before) ? listing.before : Number(defaultBefore.value.toFixed(2))),
  // A cleared box returns to the rule.
  set: (value) => {
    listing.before = isNumber(value) && value >= 0 ? value : null
  },
})

/** The start boxes show 60 days before the moment until another start is typed. */
const startDt = computed<string>({
  get: () => listing.startDt || julToIsoDateTime(momentJd() - START_DAYS_BEFORE),
  set: (value) => {
    listing.startDt = value
  },
})
const startJd = computed<number | null>({
  get: () => (isNumber(listing.startJd) ? listing.startJd : Number((momentJd() - START_DAYS_BEFORE).toFixed(5))),
  set: (value) => {
    listing.startJd = isNumber(value) ? value : null
  },
})

interface StationsResult {
  date: Moment
  end: Moment | null
  bodies: StationsForBody[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<StationsResult>('/stations')

/** One tab per body, as on the Progress page. */
const activeTab = ref(0)
watch(data, (res) => {
  if (activeTab.value >= (res?.bodies.length ?? 0)) activeTab.value = 0
})

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

/** The moment of the listing on screen, as a Julian Day. */
const listedAt = ref<number | null>(null)

/** Each row carries its event type, and the one nearest the moment in each body's table is marked. */
function rowClass(body: StationsForBody) {
  const at = listedAt.value
  const nearest = at === null || !body.stations.length ? null : body.stations.reduce((a, b) => (Math.abs(b.jd - at) < Math.abs(a.jd - at) ? b : a))
  return (row: { jd: number; type: string }) => `is-${row.type}${nearest && row.jd === nearest.jd ? ' is-nearest' : ''}`
}

function submit() {
  const at = momentJd()
  listedAt.value = at
  const jd6 = (jd: number) => Number(jd.toFixed(6))
  if (listing.mode === 'years' || listing.mode === 'days') {
    const before = daysBefore.value ?? 0
    run({ bodies: bodies.keys, jd: jd6(at - before), days: Number((daysAhead.value + before).toFixed(4)) })
    return
  }
  const start = listing.mode === 'dt' ? dateTimeStringToJul(startDt.value) : startJd.value
  run({ bodies: bodies.keys, jd: jd6(isNumber(start) ? start : at - START_DAYS_BEFORE), jd2: jd6(at) })
}
</script>

<template>
  <section class="view-page view-stations">
  <p class="view-subtitle subtitle">Each body's retrograde and direct stations around a moment, with its speed at the start of the listing.</p>

  <div class="view-form box horizontal-form">
    <BodySelect v-model="bodies.keys" />
    <MomentFields :form="moment" />
    <b-field class="listing-fields" label="Listing" grouped group-multiline>
      <b-field class="listing-mode" label="Listing mode" label-position="on-border">
        <b-select size="is-small" v-model="listing.mode">
          <option value="years" title="Years ahead of the moment">Years</option>
          <option value="days" title="Days ahead of the moment">Days</option>
          <option value="dt" title="From a start date up to the moment">Start date</option>
          <option value="jd" title="From a start Julian Day up to the moment">Start JD</option>
        </b-select>
      </b-field>
      <template v-if="listing.mode === 'years' || listing.mode === 'days'">
        <b-field v-if="listing.mode === 'years'" class="span-amount" label="Years ahead" label-position="on-border">
          <b-numberinput size="is-small" v-model="listing.years" :min="0" step="any" :controls="false" />
        </b-field>
        <b-field v-else class="span-amount" label="Days ahead" label-position="on-border">
          <b-numberinput size="is-small" v-model="listing.days" :min="0" step="any" :controls="false" />
        </b-field>
        <b-field
          class="span-amount listing-before"
          :class="{ 'is-manual': listing.before !== null }"
          label="Days before"
          label-position="on-border"
          title="Days before the moment at which the listing starts: 30 for each year ahead, in proportion, and at least 2. Type another to override; clear the box to return to the rule."
        >
          <b-numberinput size="is-small" v-model="daysBefore" :min="0" step="any" :controls="false" />
        </b-field>
      </template>
      <b-field v-else-if="listing.mode === 'dt'" label="Start (UTC)" label-position="on-border" title="The listing runs from here to the moment. Read as UTC; 60 days before the moment until changed.">
        <b-input size="is-small" v-model="startDt" type="datetime-local" step="1" />
      </b-field>
      <b-field v-else label="Start Julian Day (UT)" label-position="on-border" title="The listing runs from here to the moment; 60 days before the moment until changed.">
        <b-numberinput size="is-small" v-model="startJd" step="any" :controls="false" />
      </b-field>
    </b-field>
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default>
      <p class="result-summary">
        Stations from <UtcTime :value="(data as StationsResult).date" />
        <template v-if="(data as StationsResult).end"> to <UtcTime :value="(data as StationsResult).end!" /></template>
      </p>
      <b-tabs v-model="activeTab" size="is-small" :animated="false" class="rise-sets-tabs">
        <b-tab-item v-for="body in (data as StationsResult).bodies" :key="body.key" :label="withBodySymbol(body.key, bodyName(body.key))">
          <p class="result-summary">
            At the start of the listing: {{ body.retrograde ? 'retrograde' : 'direct' }}, speed {{ round(body.speed) }}° per day
          </p>
          <b-table :data="body.stations" :row-class="rowClass(body)" striped narrowed paginated per-page="100" class="jd-table">
            <b-table-column field="utc" label="When" v-slot="props"><UtcTime :value="props.row" /></b-table-column>
            <b-table-column field="type" label="Event" v-slot="props"><span class="station-event" :class="`is-${props.row.type}`">{{ EVENT_LABELS[props.row.type] ?? props.row.type }}</span></b-table-column>
            <b-table-column field="speed" label="Speed at station" numeric v-slot="props">{{ round(props.row.speed) }}</b-table-column>
            <template #empty>No stations in this range.</template>
          </b-table>
        </b-tab-item>
      </b-tabs>
    </template>
  </ResultPanel>
  </section>
</template>
