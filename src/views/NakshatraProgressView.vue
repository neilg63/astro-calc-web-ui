<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, rangeEndParams, useMomentForm, useRangeEndForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import { useReferenceStore } from '../stores/reference'
import { BODY_ALIASES, withBodySymbol } from '../lib/bodies'
import { ayanamshaLabel } from '../lib/zodiac'
import { formatJdSpan, round } from '../lib/format'
import MomentFields from '../components/MomentFields.vue'
import RangeEndFields from '../components/RangeEndFields.vue'
import BodySelect from '../components/BodySelect.vue'
import BodyKey from '../components/BodyKey.vue'
import UtcTime from '../components/UtcTime.vue'
import RunButton from '../components/RunButton.vue'
import ResultPanel from '../components/ResultPanel.vue'
import type { AyanamshaValue, Moment, NakshatraStep } from '../api/types'

const prefs = usePreferencesStore()
const reference = useReferenceStore()
const moment = useMomentForm()
const rangeEnd = useRangeEndForm()

onMounted(() => reference.loadAll())

/** The API's own default for nakshatras, used until another ayanamsha is chosen. */
const DEFAULT_AYANAMSHA = 'tc'

// The page keeps its own ayanamsha, as the Nakshatras page does. The Moon and the Sun are
// the two bodies that go through the nakshatras in order; the count is once round.
const form = reactive({ bodies: ['mo', 'su'], aya: prefs.ayanamshas[0] ?? DEFAULT_AYANAMSHA, num: 27 })

interface NakshatraProgressResult {
  date: Moment
  start_date: Moment
  end_date: Moment | null
  ps: string
  ayanamsha: AyanamshaValue
  /** Degrees in one nakshatra: 13°20′. */
  span: number
  bodies: { key: string; items: NakshatraStep[] }[]
}

/** A table row: a nakshatra entered, with the moment the body moves on. */
type Row = NakshatraStep & { end_jd: number | null; current: boolean }

const { data, error, loading, run, lastUrl } = useEndpoint<NakshatraProgressResult>('/nakshatras')

/** The count of the listing shown; null when it runs to an end date. */
const listed = ref<{ num: number | null } | null>(null)

const activeTab = ref(0)

/**
 * Each body's rows, each ending when the next begins. An open-ended request asks for one
 * more than the count, so the last row shown has its end too.
 */
const tabs = computed(() =>
  (data.value?.bodies ?? []).map((body) => {
    const count = listed.value?.num ?? body.items.length
    const rows: Row[] = body.items.slice(0, count).map((item, i) => ({ ...item, end_jd: body.items[i + 1]?.start_jd ?? null, current: i === 0 }))
    return { key: body.key, rows, retrograde: rows.some((row) => row.direct === false) }
  }),
)

function bodyName(key: string): string {
  return BODY_ALIASES[key] ?? reference.bodies.find((b) => b.key === key)?.name ?? key
}

/**
 * Names the row by its nakshatra (`nakshatra-1` Ashwini to `nakshatra-27` Revati) and lord,
 * marks the one in force (`is-current`) and one entered moving backwards (`is-retrograde`).
 */
function rowClass(row: Row): string {
  return `nakshatra-${row.num} lord-${row.lord}${row.current ? ' is-current' : ''}${row.direct === false ? ' is-retrograde' : ''}`
}

function submit() {
  const end = rangeEndParams(rangeEnd)
  const openEnded = Object.keys(end).length === 0
  listed.value = { num: openEnded ? form.num : null }
  activeTab.value = 0
  run({ bodies: form.bodies, ...momentParams(moment), ...end, num: openEnded ? form.num + 1 : undefined, aya: form.aya })
}
</script>

<template>
  <section class="view-page view-nakshatra-progress">
    <p class="view-subtitle subtitle">
      Each body's passage through the 27 nakshatras: the moment it enters each one and how long it stays. A planet that turns retrograde steps back into the one before.
    </p>

    <div class="view-form box horizontal-form">
      <BodySelect v-model="form.bodies" perspective="geo" />
      <MomentFields :form="moment" />
      <RangeEndFields :form="rangeEnd" />
      <b-field grouped group-multiline>
        <b-field label="Count (when open-ended)" label-position="on-border">
          <b-numberinput size="is-small" v-model="form.num" :min="1" :max="999" :controls="false" />
        </b-field>
        <b-field class="ayanamsha-select" label="Ayanamsha" label-position="on-border">
          <b-select v-model="form.aya" size="is-small">
            <option v-for="a in reference.ayanamshas" :key="a.key" :value="a.key">{{ ayanamshaLabel(a.name) }}</option>
          </b-select>
        </b-field>
      </b-field>
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          geocentric · sidereal ({{ ayanamshaLabel((res as NakshatraProgressResult).ayanamsha.name) }}, {{ round((res as NakshatraProgressResult).ayanamsha.value, 4) }}°)
        </p>
        <b-tabs v-model="activeTab" size="is-small" :animated="false" class="rise-sets-tabs nakshatra-progress-tabs">
          <b-tab-item v-for="tab in tabs" :key="tab.key" :label="withBodySymbol(tab.key, bodyName(tab.key))">
            <b-table class="jd-table nakshatra-progress-table" :data="tab.rows" :row-class="rowClass" striped narrowed hoverable :paginated="tab.rows.length > 100" per-page="100">
              <b-table-column field="num" label="#" numeric v-slot="props">{{ props.row.num }}</b-table-column>
              <b-table-column field="name" label="Nakshatra" v-slot="props"><span class="nakshatra-name">{{ props.row.name }}</span></b-table-column>
              <b-table-column field="lord" label="Lord" v-slot="props"><BodyKey :value="props.row.lord" /></b-table-column>
              <b-table-column field="start_jd" label="Entered" v-slot="props">
                <UtcTime v-if="props.row.start_jd != null" class="nakshatra-start" :value="props.row.start_jd" />
                <span v-else class="nakshatra-start is-unknown">—</span>
              </b-table-column>
              <b-table-column field="end_jd" label="Duration" numeric v-slot="props">
                <span class="nakshatra-duration" :class="{ 'is-unknown': props.row.start_jd == null || props.row.end_jd == null }">{{ formatJdSpan(props.row.start_jd, props.row.end_jd) }}</span>
              </b-table-column>
              <b-table-column field="direct" label="Motion" :visible="tab.retrograde" v-slot="props">
                <span v-if="props.row.direct === false" class="nakshatra-motion is-retrograde" title="Entered moving backwards, at its end">℞ retrograde</span>
                <span v-else-if="props.row.direct" class="nakshatra-motion is-direct">direct</span>
              </b-table-column>
            </b-table>
          </b-tab-item>
        </b-tabs>
      </template>
    </ResultPanel>
  </section>
</template>
