<script setup lang="ts">
defineProps<{ loading: boolean; error: string | null; data: unknown; lastUrl?: string }>()
</script>

<template>
  <div class="result-panel">
    <b-notification v-if="error" type="is-danger" :closable="false">{{ error }}</b-notification>
    <div v-if="loading" class="has-text-centered py-4">
      <b-loading :is-full-page="false" active />
    </div>
    <template v-else-if="data">
      <p v-if="lastUrl" class="is-size-7 has-text-grey mb-2">
        <a :href="lastUrl" target="_blank" rel="noopener">{{ lastUrl }}</a>
      </p>
      <slot :data="data" />
      <b-collapse class="mt-4" animation="slide">
        <template #trigger="props">
          <a class="is-size-7">{{ props.open ? 'Hide' : 'Show' }} raw JSON</a>
        </template>
        <pre class="raw-json">{{ JSON.stringify(data, null, 2) }}</pre>
      </b-collapse>
    </template>
  </div>
</template>

<style scoped>
.raw-json {
  max-height: 24rem;
  overflow: auto;
  font-size: 0.8rem;
}
</style>
