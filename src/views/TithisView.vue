<script setup lang="ts">
import RunButton from '../components/RunButton.vue'
import { computed, reactive, ref } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, rangeEndParams, useMomentForm, useRangeEndForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import RangeEndFields from '../components/RangeEndFields.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { round } from '../lib/format'
import type { KaranaEntry, KaranaInfo, Moment, TithiEntry, TithiInfo } from '../api/types'

const moment = useMomentForm()
const rangeEnd = useRangeEndForm()
const opts = reactive({ num: 30, karanas: false })

interface TithisResult {
  date: Moment
  ps: string
  elongation: number
  elongation_speed: number
  /** The tithi and the karana in force at the date. */
  tithi: TithiInfo
  karana: KaranaInfo
  /** One of the two lists: karanas when they were asked for. */
  tithis?: TithiEntry[]
  karanas?: KaranaEntry[]
}

/** A table row: a tithi or a karana, with the moment the next one begins. */
type Row = (TithiEntry | KaranaEntry) & { end: Moment | null; hours: number | null; current: boolean }

/** Symbols and display names of the phases a tithi or karana can begin at. */
const PHASES: Record<string, { icon: string; label: string; num: number }> = {
  New: { icon: '●', label: 'New moon', num: 1 },
  FirstQuarter: { icon: '☽', label: 'First quarter', num: 2 },
  Full: { icon: '○', label: 'Full moon', num: 3 },
  LastQuarter: { icon: '☾', label: 'Last quarter', num: 4 },
}

const { data, error, loading, run, lastUrl } = useEndpoint<TithisResult>('/tithis')

/** The count of the listing shown; null when it runs to an end date. */
const listed = ref<{ num: number | null } | null>(null)

/** Whether the result on screen lists karanas. */
const showsKaranas = computed(() => Array.isArray(data.value?.karanas))

/**
 * The rows, each ending when the next begins. An open-ended request asks for one more than
 * the count, so the last row shown has its end too.
 */
const rows = computed<Row[]>(() => {
  const all: (TithiEntry | KaranaEntry)[] = data.value?.karanas ?? data.value?.tithis ?? []
  const at = data.value?.date.jd ?? 0
  const count = listed.value?.num ?? all.length
  return all.slice(0, count).map((item, i) => {
    const next = all[i + 1] ?? null
    return { ...item, end: next, hours: next ? (next.jd - item.jd) * 24 : null, current: i === 0 && item.jd <= at }
  })
})

function paksha(num: number): 'shukla' | 'krishna' {
  return num <= 15 ? 'shukla' : 'krishna'
}

/** The tithi a row belongs to: its own number, or a karana's tithi. */
function tithiNum(row: Row): number {
  return 'tithi' in row ? row.tithi : row.num
}

/**
 * Names the row by its paksha (`paksha-shukla`, `paksha-krishna`), by the phase it begins at
 * (`phase-1` new moon to `phase-4` last quarter) and marks the one in force (`is-current`).
 */
function rowClass(row: Row): string {
  const phase = row.phase ? ` phase-${PHASES[row.phase]?.num}` : ''
  return `paksha-${paksha(tithiNum(row))}${phase}${row.current ? ' is-current' : ''}`
}

/** A tithi's full name, such as "Shukla Dwadashi"; Purnima and Amavasya stand alone. */
function tithiName(t: TithiInfo): string {
  return t.day === 15 ? t.name : `${t.paksha} ${t.name}`
}

function submit() {
  const end = rangeEndParams(rangeEnd)
  const openEnded = Object.keys(end).length === 0
  listed.value = { num: openEnded ? opts.num : null }
  run({ ...momentParams(moment), ...end, num: openEnded ? opts.num + 1 : undefined, karanas: opts.karanas ? 1 : undefined })
}
</script>

<template>
  <section class="view-page view-tithis">
    <p class="view-subtitle subtitle">The lunar days of the Indian calendar: thirty 12° steps of the Moon's elongation from the Sun. Times are geocentric, the same everywhere on Earth.</p>

    <div class="view-form box horizontal-form">
      <MomentFields :form="moment" />
      <RangeEndFields :form="rangeEnd" />
      <b-field grouped group-multiline>
        <b-field label="Count (when open-ended)" label-position="on-border">
          <b-numberinput size="is-small" v-model="opts.num" :min="1" :max="999" :controls="false" />
        </b-field>
        <b-checkbox class="karanas-toggle" size="is-small" v-model="opts.karanas" title="The sixty half tithis; all four Moon phases fall on their boundaries">Karanas (half tithis)</b-checkbox>
      </b-field>
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="tithi-now mb-2">
          <strong>{{ tithiName((res as TithisResult).tithi) }}</strong> (tithi {{ (res as TithisResult).tithi.num }}),
          karana {{ (res as TithisResult).karana.name }} ·
          elongation {{ round((res as TithisResult).elongation, 2) }}°, speed {{ round((res as TithisResult).elongation_speed, 4) }}°/day
        </p>
        <b-table class="tithis-table" :data="rows" :row-class="rowClass" striped narrowed>
          <b-table-column field="num" label="#" numeric v-slot="props">{{ props.row.num }}</b-table-column>
          <b-table-column field="name" :label="showsKaranas ? 'Karana' : 'Tithi'" v-slot="props">
            <span class="tithi-name">{{ props.row.name }}</span>
          </b-table-column>
          <b-table-column field="tithi" label="Tithi" numeric :visible="showsKaranas" v-slot="props">{{ props.row.tithi }}</b-table-column>
          <b-table-column field="half" label="Half" numeric :visible="showsKaranas" v-slot="props">{{ props.row.half }}</b-table-column>
          <b-table-column field="paksha" label="Paksha" v-slot="props">
            <span class="tithi-paksha">{{ paksha(tithiNum(props.row)) === 'shukla' ? 'Shukla' : 'Krishna' }}</span>
          </b-table-column>
          <b-table-column field="jd" label="Begins" v-slot="props"><UtcTime :value="props.row" /></b-table-column>
          <b-table-column field="end" label="Ends" v-slot="props"><UtcTime v-if="props.row.end" :value="props.row.end" /></b-table-column>
          <b-table-column field="hours" label="Hours" numeric v-slot="props">{{ props.row.hours === null ? '' : round(props.row.hours, 2) }}</b-table-column>
          <b-table-column field="phase" label="Begins at" v-slot="props">
            <span v-if="props.row.phase" class="moon-phase" :class="`is-${PHASES[props.row.phase]?.num}`">
              <span class="moon-phase-icon">{{ PHASES[props.row.phase]?.icon }}</span>
              {{ PHASES[props.row.phase]?.label ?? props.row.phase }}
            </span>
          </b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
