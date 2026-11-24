<script setup lang="ts">
import { ayanamshaApplies, useAyanamshaKey } from '../lib/queryForms'
import BodyKey from '../components/BodyKey.vue'
import RunButton from '../components/RunButton.vue'
import { ayanamshaLabel } from '../lib/zodiac'
import { computed, reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm } from '../lib/queryForms'
import { usePreferencesStore } from '../stores/preferences'
import { perspective, positionBodies } from '../lib/perspectives'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaSelect from '../components/AyanamshaSelect.vue'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { round } from '../lib/format'
import PointsList from '../components/PointsList.vue'
import type { Angles, AyanamshaValue, ExtendedBodyPosition, GeoJson } from '../api/types'

const prefs = usePreferencesStore()
const moment = useMomentForm()
const view = useViewForm()
const aya = useAyanamshaKey(() => view.ps)
const form = reactive({ bodies: [...CORE_BODY_KEYS], speeds: false, paired: false })

/** The fields of a body without its key. */
type ViewBlock = Omit<ExtendedBodyPosition, 'key'>

/**
 * A body of a `ps=both` response: the same fields from the centre of the Earth (`geo`, the
 * perspective's short key; `geoc` from an older API) and from the place.
 */
interface PairedBody {
  key: string
  geo?: ViewBlock
  geoc?: ViewBlock
  topo: ViewBlock
}

/** A table row: a body, or one of its two views in a paired result. */
interface Row extends ExtendedBodyPosition {
  view?: 'geoc' | 'topo'
}

const VIEW_LABELS = { geoc: 'Geocentric', topo: 'Topocentric' }

interface ExtendedResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  /** With `ps=both` each body holds a geocentric and a topocentric block. */
  bodies: (ExtendedBodyPosition | PairedBody)[]
  /** The chart points of the moment and place: from a place on the Earth's surface only. */
  points?: Angles
}

/** Only an observer on the Earth has a horizon, and so needs a place. */
const onEarth = computed(() => perspective(view.ps).earth)

const { data, error, loading, run, lastUrl } = useEndpoint<ExtendedResult>('/extended-positions')

/** Geocentric and topocentric values can be paired: the two perspectives that differ by parallax. */
const canPair = computed(() => view.ps === 'topo' || view.ps === 'geo')
const paired = computed(() => form.paired && canPair.value)

/** Whether the result on screen is a paired one. */
const isPaired = computed(() => data.value?.ps === 'both')

/** One row per body, or two in a paired result: geocentric first, topocentric under it. */
const rows = computed<Row[]>(() =>
  (data.value?.bodies ?? []).flatMap((body): Row[] =>
    'topo' in body ? [{ key: body.key, view: 'geoc', ...((body.geo ?? body.geoc) as ViewBlock) }, { key: body.key, view: 'topo', ...body.topo }] : [body],
  ),
)

function rowClass(row: Row): string {
  return row.view ? `is-${row.view}` : ''
}

/** Whether the result has azimuth and altitude: not so from a centre away from the Earth. */
const hasHorizon = computed(() => rows.value.some((row) => row.azi !== null && row.azi !== undefined))


function submit() {
  run({
    // A paired request is resolved as topocentric, so the ascendant leads the list.
    bodies: positionBodies(form.bodies, paired.value ? 'topo' : view.ps),
    ...momentParams(moment),
    ps: paired.value ? 'both' : view.ps,
    loc: onEarth.value ? prefs.loc : undefined,
    aya: aya.value,
    sid: aya.value ? 1 : undefined,
  })
}
</script>

<template>
  <section class="view-page view-extended-positions">
    <p class="view-subtitle subtitle">Ecliptic, equatorial and horizontal coordinates together. On the Earth this needs a place; from other centres there is no horizon.</p>

    <div class="view-form box horizontal-form">
      <BodySelect v-model="form.bodies" :perspective="view.ps" />
      <MomentFields :form="moment" />
      <ViewFields :form="view" hide-cs :location-required="onEarth" />
      <AyanamshaSelect v-if="ayanamshaApplies(view.ps)" v-model="aya" />
      <b-field grouped group-multiline>
        <b-checkbox v-if="canPair" class="paired-views-toggle" size="is-small" v-model="form.paired" title="Each body is given twice: from the centre of the Earth and from your place">Geocentric and topocentric together</b-checkbox>
        <b-checkbox size="is-small" v-model="form.speeds">Show speeds</b-checkbox>
      </b-field>
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          {{ isPaired ? 'geocentric and topocentric' : (res as ExtendedResult).ps }} ·
          <template v-if="(res as ExtendedResult).sidereal && (res as ExtendedResult).ayanamshas.length">
            sidereal longitude ({{ ayanamshaLabel((res as ExtendedResult).ayanamshas[0].name) }}, {{ round((res as ExtendedResult).ayanamshas[0].value, 4) }}°)
          </template>
          <template v-else>tropical longitude</template>
          · angles in degrees, speeds in °/day, distance in AU
        </p>
        <PointsList v-if="(res as ExtendedResult).points" :points="(res as ExtendedResult).points!" :ayanamsha="(res as ExtendedResult).ayanamshas[0]" />
        <b-table :class="{ 'paired-views-table': isPaired }" :data="rows" :striped="!isPaired" :row-class="rowClass" narrowed scrollable>
          <b-table-column field="key" label="Body" v-slot="props"><BodyKey v-if="props.row.view !== 'topo'" :value="props.row.key" /></b-table-column>
          <b-table-column field="view" label="Seen from" :visible="isPaired" v-slot="props"><span class="paired-view-label">{{ VIEW_LABELS[props.row.view as 'geoc' | 'topo'] }}</span></b-table-column>
          <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
          <b-table-column field="lat" label="Latitude" numeric v-slot="props">{{ round(props.row.lat) }}</b-table-column>
          <b-table-column field="ras" label="Right asc." numeric v-slot="props">{{ round(props.row.ras) }}</b-table-column>
          <b-table-column field="dcl" label="Declination" numeric v-slot="props">{{ round(props.row.dcl) }}</b-table-column>
          <b-table-column field="azi" label="Azimuth" numeric :visible="hasHorizon" v-slot="props">{{ round(props.row.azi) }}</b-table-column>
          <b-table-column field="alt" label="Altitude" numeric :visible="hasHorizon" v-slot="props">{{ round(props.row.alt) }}</b-table-column>
          <b-table-column field="lng_speed" label="Lng speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.lng_speed) }}</b-table-column>
          <b-table-column field="lat_speed" label="Lat speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.lat_speed) }}</b-table-column>
          <b-table-column field="ras_speed" label="RA speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.ras_speed) }}</b-table-column>
          <b-table-column field="dcl_speed" label="Decl speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.dcl_speed) }}</b-table-column>
          <b-table-column field="azi_speed" label="Azi speed" numeric :visible="form.speeds && hasHorizon" v-slot="props">{{ round(props.row.azi_speed) }}</b-table-column>
          <b-table-column field="alt_speed" label="Alt speed" numeric :visible="form.speeds && hasHorizon" v-slot="props">{{ round(props.row.alt_speed) }}</b-table-column>
          <b-table-column field="dist" label="Distance" numeric v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
          <b-table-column field="dist_speed" label="Dist speed" numeric :visible="form.speeds" v-slot="props">{{ round(props.row.dist_speed, 6) }}</b-table-column>
        </b-table>
      </template>
    </ResultPanel>
  </section>
</template>
