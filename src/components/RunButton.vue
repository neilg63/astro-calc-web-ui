<script setup lang="ts">
/**
 * The button that sends a form's query: a large play arrow with no visible label, named
 * "Calculate" by its tooltip and to screen readers.
 */
defineProps<{ loading?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <b-tooltip class="run-button" label="Calculate" position="is-left">
    <b-button type="is-primary" icon-left="play" aria-label="Calculate" :loading="loading" @click="$emit('click')" />
  </b-tooltip>
</template>
