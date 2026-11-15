<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReferenceStore } from '../stores/reference'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const reference = useReferenceStore()

onMounted(() => reference.loadAll())

const selected = computed({
  get: () => props.modelValue,
  set: (value: string[]) => emit('update:modelValue', value),
})
</script>

<template>
  <b-field class="house-system-select" label="House systems" label-position="on-border">
    <b-select size="is-small" multiple expanded native-size="6" v-model="selected">
      <option v-for="h in reference.houseSystems" :key="h.code" :value="h.code">{{ h.name }}</option>
    </b-select>
  </b-field>
</template>
