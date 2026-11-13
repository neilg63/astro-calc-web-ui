<script setup lang="ts">
import { reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS } from '../stores/reference'
import { aspectsParam, momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import LocationFields from '../components/LocationFields.vue'
import BodySelect from '../components/BodySelect.vue'
import AspectOrbsEditor from '../components/AspectOrbsEditor.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { usePreferencesStore, type AspectDef } from '../stores/preferences'
import { round } from '../lib/format'
import type { AspectMatch, AspectTarget, BodyPosition } from '../api/types'

const moment = useMomentForm()
const prefs = usePreferencesStore()
const bodies = reactive({ keys: [...CORE_BODY_KEYS] })
const ps = reactive({ value: 'geo' as 'geo' | 'topo' })
const aspects = reactive<{ defs: AspectDef[] }>({ defs: prefs.aspects.map((a) => ({ ...a })) })

interface AspectsResult {
  date: unknown
  ps: string
  targets: AspectTarget[]
  bodies: Pick<BodyPosition, 'key' | 'lng'>[]
  aspects: AspectMatch[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<AspectsResult>('/aspects')

function submit() {
  run({
    bodies: bodies.keys,
    ...momentParams(moment),
    ps: ps.value,
    loc: ps.value === 'topo' ? prefs.loc : undefined,
    aspects: aspectsParam(aspects.defs),
  })
}
</script>

<template>
  <section class="view-page view-aspects">
  <h1 class="view-title title">Aspects</h1>
  <p class="view-subtitle subtitle">Every aspect between the selected bodies, by ecliptic longitude.</p>

  <div class="view-form box">
    <BodySelect v-model="bodies.keys" />
    <MomentFields :form="moment" />
    <b-field label="Perspective" label-position="on-border">
      <b-select v-model="ps.value">
        <option value="geo">Geocentric</option>
        <option value="topo">Topocentric</option>
      </b-select>
    </b-field>
    <LocationFields v-if="ps.value === 'topo'" />
    <AspectOrbsEditor v-model="aspects.defs" />
    <b-button type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="(res as AspectsResult).aspects" striped narrowed paginated per-page="25">
        <b-table-column field="a" label="Body A" v-slot="props">{{ props.row.a }}</b-table-column>
        <b-table-column field="b" label="Body B" v-slot="props">{{ props.row.b }}</b-table-column>
        <b-table-column field="aspect" label="Aspect" v-slot="props">{{ round(props.row.aspect, 1) }}°</b-table-column>
        <b-table-column field="orb" label="Orb" v-slot="props">{{ round(props.row.orb, 2) }}</b-table-column>
        <b-table-column field="divergence" label="Divergence" v-slot="props">{{ round(props.row.divergence, 3) }}</b-table-column>
        <b-table-column field="separation" label="Separation" v-slot="props">{{ round(props.row.separation, 3) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
