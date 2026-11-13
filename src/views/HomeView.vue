<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useEndpoint } from '../api/useEndpoint'
import type { IndexInfo } from '../api/types'
import ResultPanel from '../components/ResultPanel.vue'
import { formatMoment } from '../lib/format'
import { ENDPOINT_LINKS } from '../lib/navLinks'

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

  <div class="tile-grid mt-4">
    <RouterLink v-for="l in ENDPOINT_LINKS" :key="l.to" :to="l.to" class="tile-link">
      <span class="icon is-large"><i class="mdi" :class="`mdi-${l.icon}`" /></span>
      <span class="tile-label">{{ l.label }}</span>
      <span class="tile-blurb">{{ l.blurb }}</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.75rem;
}
.tile-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.25rem;
  padding: 1.25rem 0.5rem;
  border-radius: 8px;
  background: #1a1a1a;
  border: 1px solid #2c2c2c;
  color: inherit;
  transition: background 0.15s, border-color 0.15s;
}
.tile-link:hover {
  background: #232323;
  border-color: #3dd6b4;
}
.tile-link .icon {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}
.tile-label {
  font-weight: 600;
}
.tile-blurb {
  font-size: 0.75rem;
  opacity: 0.65;
}
</style>
