<script setup lang="ts">
import AyanamshaList from '../components/AyanamshaList.vue'
import BodyKey from '../components/BodyKey.vue'
import RunButton from '../components/RunButton.vue'
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm, viewParams } from '../lib/queryForms'
import { positionBodies } from '../lib/perspectives'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaFields from '../components/AyanamshaFields.vue'
import { ayanamshaApplies, useAyanamshaChoice } from '../lib/queryForms'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { coordColumns, round } from '../lib/format'
import PointsList from '../components/PointsList.vue'
import type { Angles, AyanamshaValue, BodyPosition, GeoJson } from '../api/types'

const moment = useMomentForm()
const view = useViewForm()
const bodies = reactive({ keys: [...CORE_BODY_KEYS] })
// A ref, not a reactive object: the field replaces the whole value on every change.
const aya = useAyanamshaChoice(() => view.ps)

interface PositionsResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  bodies: BodyPosition[]
  /** The chart points of the moment and place: from a place on the Earth's surface only. */
  points?: Angles
}

const { data, error, loading, run, lastUrl } = useEndpoint<PositionsResult>('/positions')
/** The angle columns follow the coordinate system of the response. */
const cols = computed(() => coordColumns(data.value?.cs))

function submit() {
  run({ bodies: positionBodies(bodies.keys, view.ps), ...momentParams(moment), ...viewParams(view), aya: aya.value.aya, sid: aya.value.sid ? 1 : undefined })
}
</script>

<template>
  <section class="view-page view-positions">
  <p class="view-subtitle subtitle">Several bodies at one moment. From a place on the Earth's surface the ascendant leads the list.</p>

  <div class="view-form box horizontal-form">
    <BodySelect v-model="bodies.keys" :perspective="view.ps" />
    <MomentFields :form="moment" />
    <ViewFields :form="view" />
    <AyanamshaFields v-if="ayanamshaApplies(view.ps)" v-model="aya" show-sidereal />
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <PointsList v-if="(res as PositionsResult).points" :points="(res as PositionsResult).points!" :ayanamsha="(res as PositionsResult).ayanamshas[0]" />
      <AyanamshaList :ayanamshas="(res as PositionsResult).ayanamshas" />
      <b-table :data="(res as PositionsResult).bodies" striped narrowed>
        <b-table-column field="key" label="Body" v-slot="props"><BodyKey :value="props.row.key" /></b-table-column>
        <b-table-column :field="cols.first" :label="cols.firstLabel" v-slot="props">
          <DegreeValue v-if="cols.ecliptic" :value="props.row[cols.first]" />
          <template v-else>{{ round(props.row[cols.first]) }}°</template>
        </b-table-column>
        <b-table-column :field="cols.second" :label="cols.secondLabel" v-slot="props">{{ round(props.row[cols.second]) }}</b-table-column>
        <b-table-column :field="`${cols.first}_speed`" :label="`${cols.firstLabel} speed`" v-slot="props">{{ round(props.row[`${cols.first}_speed`]) }}</b-table-column>
        <b-table-column :field="`${cols.second}_speed`" :label="`${cols.secondLabel} speed`" v-slot="props">{{ round(props.row[`${cols.second}_speed`]) }}</b-table-column>
        <b-table-column field="dist" label="Distance" v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
        <b-table-column field="dist_speed" label="Dist speed" v-slot="props">{{ round(props.row.dist_speed, 6) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
