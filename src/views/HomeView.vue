<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useEndpoint } from '../api/useEndpoint'
import type { IndexInfo } from '../api/types'
import UtcTime from '../components/UtcTime.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { ENDPOINT_LINKS } from '../lib/navLinks'

const { data, error, loading, run } = useEndpoint<IndexInfo>('/')
onMounted(() => run({}))
</script>

<template>
  <section class="view-page view-home">
    <p class="view-subtitle subtitle">A browser front end for every astro-calc-api endpoint.</p>

    <div class="home-tile-grid mt-4">
      <RouterLink v-for="l in ENDPOINT_LINKS" :key="l.to" :to="l.to" class="home-tile">
        <span class="home-tile-icon icon is-large"><i class="mdi" :class="`mdi-${l.icon}`" /></span>
        <span class="home-tile-label">{{ l.label }}</span>
        <span class="home-tile-blurb">{{ l.blurb }}</span>
      </RouterLink>
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading">
      <template #default="{ data: info }">
        <div class="home-info-box box">
          <p><strong>{{ (info as IndexInfo).name }}</strong> v{{ (info as IndexInfo).version }}</p>
          <p v-if="(info as IndexInfo).ephemeris_range">
            Ephemeris coverage: <UtcTime :value="(info as IndexInfo).ephemeris_range!.from" mode="utc" /> —
            <UtcTime :value="(info as IndexInfo).ephemeris_range!.to" mode="utc" />
          </p>
          <p>Station table: {{ (info as IndexInfo).station_table ? 'available' : 'not loaded' }}</p>
        </div>
      </template>
    </ResultPanel>
  </section>
</template>
