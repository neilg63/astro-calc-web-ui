<script setup lang="ts">
import { onMounted } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import type { StarRef } from '../api/types'
import ResultPanel from '../components/ResultPanel.vue'

const { data, error, loading, run } = useEndpoint<{ stars: StarRef[] }>('/stars')
onMounted(() => run({}))
</script>

<template>
  <h1 class="title">Named Stars</h1>
  <ResultPanel :data="data" :error="error" :loading="loading">
    <template #default="{ data: res }">
      <b-table :data="(res as { stars: StarRef[] }).stars" striped narrowed paginated per-page="20">
        <b-table-column field="key" label="Key" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="name" label="Name" v-slot="props">{{ props.row.name }}</b-table-column>
        <b-table-column field="hip" label="HIP" v-slot="props">{{ props.row.hip }}</b-table-column>
        <b-table-column field="magnitude" label="Magnitude" v-slot="props">{{ props.row.magnitude ?? '—' }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
</template>
