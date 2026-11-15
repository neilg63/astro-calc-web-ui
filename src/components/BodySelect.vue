<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReferenceStore } from '../stores/reference'
import TagPicker from './TagPicker.vue'

const props = defineProps<{ modelValue: string[]; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const reference = useReferenceStore()

onMounted(() => reference.loadAll())

/** Names astrologers use for bodies the API lists under another name. */
const ALIASES: Record<string, string> = { ra: 'Rahu', ke: 'Ketu' }

const options = computed(() =>
  reference.bodies.filter((b) => b.available).map((b) => ({ key: b.key, label: ALIASES[b.key] ? `${ALIASES[b.key]} (${b.name})` : b.name })),
)
</script>

<template>
  <b-field class="body-select" :label="label ?? 'Bodies'">
    <TagPicker :model-value="props.modelValue" @update:model-value="(v: string[]) => emit('update:modelValue', v)" :options="options" placeholder="Add a body" item-name="body" />
  </b-field>
</template>
