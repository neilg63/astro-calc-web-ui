<script setup lang="ts">
import { withBodySymbol } from '../lib/bodies'
import RunButton from '../components/RunButton.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS, useReferenceStore } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm, viewParams } from '../lib/queryForms'
import { observableBodies } from '../lib/perspectives'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import BodySelect from '../components/BodySelect.vue'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { coordColumns, round } from '../lib/format'
import type { AyanamshaValue, GeoJson, Moment } from '../api/types'

const reference = useReferenceStore()
const moment = useMomentForm()
const view = useViewForm()
const bodies = reactive({ keys: [...CORE_BODY_KEYS] })
const span = reactive({ unit: 'days' as 'days' | 'years', amount: 7, pd: 1 })

interface ProgressItem {
  lng: number
  lat: number
  lng_speed: number
  lat_speed: number
  dist: number
  dist_speed: number
  jd: number
  age?: number
  date?: Moment
}

interface ProgressBody {
  key: string
  items: ProgressItem[]
}

interface ProgressResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  progressed: boolean
  span: number
  unit: string
  per_unit: number
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  bodies: ProgressBody[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<ProgressResult>('/progress')
/** The angle columns follow the coordinate system of the response. */
const cols = computed(() => coordColumns(data.value?.cs))

/** One tab per body, as on the Rise / Set by Day page. */
const activeTab = ref(0)
watch(data, (res) => {
  if (activeTab.value >= (res?.bodies.length ?? 0)) activeTab.value = 0
})

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

function submit() {
  run({
    bodies: observableBodies(bodies.keys, view.ps),
    ...momentParams(moment),
    ...viewParams(view),
    pd: span.pd,
    days: span.unit === 'days' ? span.amount : undefined,
    years: span.unit === 'years' ? span.amount : undefined,
  })
}
</script>

<template>
  <section class="view-page view-progress">
  <p class="view-subtitle subtitle">A series of positions over time, or a secondary-progression series (one day per year).</p>

  <div class="view-form box horizontal-form">
    <BodySelect v-model="bodies.keys" :perspective="view.ps" />
    <MomentFields :form="moment" label="Start" />
    <ViewFields :form="view" />
    <b-field grouped group-multiline>
      <b-field label="Span unit" label-position="on-border">
        <b-select size="is-small" v-model="span.unit">
          <option value="days">Days</option>
          <option value="years" title="Secondary progression: one day per year">Years</option>
        </b-select>
      </b-field>
      <b-field class="span-amount" :label="span.unit === 'days' ? 'Days' : 'Years'" :title="span.unit === 'days' ? 'Number of days' : 'Number of years'" label-position="on-border">
        <b-numberinput size="is-small" v-model="span.amount" :min="0" :controls="false" />
      </b-field>
      <b-field class="span-per-unit" :label="span.unit === 'days' ? 'Per day' : 'Per year'" :title="span.unit === 'days' ? 'Records per day' : 'Records per year'" label-position="on-border">
        <b-numberinput size="is-small" v-model="span.pd" :min="0.01" step="any" :controls="false" />
      </b-field>
    </b-field>
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default>
      <b-tabs v-model="activeTab" size="is-small" :animated="false" class="rise-sets-tabs">
        <b-tab-item v-for="body in (data as ProgressResult).bodies" :key="body.key" :label="withBodySymbol(body.key, bodyName(body.key))">
          <b-table :data="body.items" striped narrowed paginated per-page="100" class="jd-table">
            <b-table-column field="jd" label="Date-time" v-slot="props"><UtcTime :value="props.row.jd" /></b-table-column>
            <b-table-column v-if="(data as ProgressResult).progressed" field="date" label="Life date" v-slot="props"><UtcTime :value="props.row.date" /></b-table-column>
            <b-table-column v-if="(data as ProgressResult).progressed" field="age" label="Age" v-slot="props">{{ round(props.row.age, 3) }}</b-table-column>
            <b-table-column :field="cols.first" :label="cols.firstLabel" v-slot="props">
              <DegreeValue v-if="cols.ecliptic" :value="props.row[cols.first]" />
              <template v-else>{{ round(props.row[cols.first]) }}°</template>
            </b-table-column>
            <b-table-column :field="cols.second" :label="cols.secondLabel" v-slot="props">{{ round(props.row[cols.second]) }}</b-table-column>
            <b-table-column :field="`${cols.first}_speed`" :label="`${cols.firstLabel} speed`" v-slot="props">{{ round(props.row[`${cols.first}_speed`]) }}</b-table-column>
            <b-table-column field="dist" label="Distance" v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
          </b-table>
        </b-tab-item>
      </b-tabs>
    </template>
  </ResultPanel>
  </section>
</template>
