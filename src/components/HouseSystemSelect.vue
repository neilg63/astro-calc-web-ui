<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReferenceStore } from '../stores/reference'
import TagPicker from './TagPicker.vue'
import { shortHouseName } from '../lib/houses'

/** The house systems of a request, picked as tags like the bodies. Tags carry a short label, with the full name and the API's letter as a tooltip and in the suggestions. */
const props = defineProps<{ modelValue: string[]; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const reference = useReferenceStore()

onMounted(() => reference.loadAll())

const options = computed(() => reference.houseSystems.map((h) => ({ key: h.code, label: shortHouseName(h), title: h.name })))
</script>

<template>
  <b-field class="house-system-select" :label="label ?? 'House systems'">
    <TagPicker :model-value="props.modelValue" @update:model-value="(v: string[]) => emit('update:modelValue', v)" :options="options" placeholder="Add a house system" item-name="house system" />
  </b-field>
</template>
