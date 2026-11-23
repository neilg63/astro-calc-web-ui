<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { bodyFullName, bodySymbol } from '../lib/bodies'
import { useReferenceStore } from '../stores/reference'

/**
 * A body or point by its API abbreviation, with its Unicode symbol first (`♃ ju`) and its
 * full name as the tooltip (`Ketu / South Node` for `ke`). This is the form for table cells.
 * With `named`, for running text, the name is shown too: `♃ Jupiter (ju)`.
 */
const props = defineProps<{ value: string; named?: boolean }>()

const reference = useReferenceStore()
onMounted(() => reference.loadAll())

const symbol = computed(() => bodySymbol(props.value))
const name = computed(() => bodyFullName(props.value, reference.bodies.find((b) => b.key === props.value)?.name ?? ''))
</script>

<template>
  <b-tooltip class="body-key" :label="name || value" :active="!!name" position="is-right">
    <span v-if="symbol" class="body-key-symbol" aria-hidden="true">{{ symbol }}</span>
    <template v-if="named && name"><span class="body-key-name">{{ name }}</span> <span class="body-key-abbr">({{ value }})</span></template>
    <span v-else class="body-key-abbr">{{ value }}</span>
  </b-tooltip>
</template>
