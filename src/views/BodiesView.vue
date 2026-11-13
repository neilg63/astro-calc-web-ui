<script setup lang="ts">
import { onMounted } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import type { BodyRef } from '../api/types'
import ResultPanel from '../components/ResultPanel.vue'

const { data, error, loading, run } = useEndpoint<{ bodies: BodyRef[] }>('/bodies')
onMounted(() => run({}))
</script>

<template>
  <section class="view-page view-bodies">
  <h1 class="view-title title">Bodies</h1>
  <ResultPanel :data="data" :error="error" :loading="loading">
    <template #default="{ data: res }">
      <b-table :data="(res as { bodies: BodyRef[] }).bodies" striped narrowed>
        <b-table-column field="key" label="Key" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="name" label="Name" v-slot="props">{{ props.row.name }}</b-table-column>
        <b-table-column field="available" label="Available" v-slot="props">
          <b-tag :type="props.row.available ? 'is-success' : 'is-light'">{{ props.row.available ? 'yes' : 'no' }}</b-tag>
        </b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
