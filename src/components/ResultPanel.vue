<script setup lang="ts">
defineProps<{ loading: boolean; error: string | null; data: unknown; lastUrl?: string }>()
</script>

<template>
  <div class="result-panel">
    <b-notification v-if="error" type="is-danger" class="result-panel-error" :closable="false">{{ error }}</b-notification>
    <div v-if="loading" class="result-panel-loading has-text-centered py-4">
      <b-loading :is-full-page="false" active />
    </div>
    <template v-else-if="data">
      <p v-if="lastUrl" class="result-panel-url is-size-7 has-text-grey mb-2">
        <a :href="lastUrl" target="_blank" rel="noopener">{{ lastUrl }}</a>
      </p>
      <div class="result-panel-body">
        <slot :data="data" />
      </div>
      <b-collapse class="result-panel-raw-toggle mt-4" animation="slide" :model-value="false">
        <template #trigger="props">
          <a class="is-size-7">{{ props.open ? 'Hide' : 'Show' }} raw JSON</a>
        </template>
        <pre class="result-panel-raw">{{ JSON.stringify(data, null, 2) }}</pre>
      </b-collapse>
    </template>
  </div>
</template>
