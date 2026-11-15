<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReferenceStore } from '../stores/reference'

/** One ayanamsha key, or '' for tropical longitudes. */
const props = defineProps<{ modelValue: string; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const reference = useReferenceStore()

onMounted(() => reference.loadAll())

const selected = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>

<template>
  <b-field class="ayanamsha-select" :label="label ?? 'Zodiac'" label-position="on-border">
    <b-select v-model="selected" size="is-small">
      <option value="">Tropical</option>
      <option v-for="a in reference.ayanamshas" :key="a.key" :value="a.key">{{ a.name.replace(/_/g, ' ') }}</option>
    </b-select>
  </b-field>
</template>
