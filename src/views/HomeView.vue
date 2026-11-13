<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useEndpoint } from '../api/useEndpoint'
import type { IndexInfo } from '../api/types'
import ResultPanel from '../components/ResultPanel.vue'
import { formatMoment } from '../lib/format'

const { data, error, loading, run } = useEndpoint<IndexInfo>('/')
onMounted(() => run({}))
</script>

<template>
  <h1 class="title">astro-calc-web-ui</h1>
  <p class="subtitle">A browser front end for every astro-calc-api endpoint.</p>

  <ResultPanel :data="data" :error="error" :loading="loading">
    <template #default="{ data: info }">
      <div class="box">
        <p><strong>{{ (info as IndexInfo).name }}</strong> v{{ (info as IndexInfo).version }}</p>
        <p v-if="(info as IndexInfo).ephemeris_range">
          Ephemeris coverage: {{ formatMoment((info as IndexInfo).ephemeris_range!.from) }} —
          {{ formatMoment((info as IndexInfo).ephemeris_range!.to) }}
        </p>
        <p>Station table: {{ (info as IndexInfo).station_table ? 'available' : 'not loaded' }}</p>
      </div>
    </template>
  </ResultPanel>

  <div class="columns is-multiline mt-4">
    <div class="column is-one-quarter" v-for="l in [
      ['/position', 'Position'], ['/positions', 'Positions'], ['/progress', 'Progress'],
      ['/ascendant', 'Ascendant'], ['/angles', 'Angles'], ['/houses', 'Houses'],
      ['/ayanamsha', 'Ayanamsha'], ['/rise-set', 'Rise / Set'], ['/stations', 'Stations'],
      ['/moon-phases', 'Moon Phases'], ['/indian-day', 'Indian Day'], ['/pheno', 'Phenomena'],
      ['/aspects', 'Aspects'], ['/bodies', 'Bodies'], ['/stars', 'Stars'],
    ]" :key="l[0]">
      <RouterLink :to="l[0]" class="button is-fullwidth">{{ l[1] }}</RouterLink>
    </div>
  </div>
</template>
