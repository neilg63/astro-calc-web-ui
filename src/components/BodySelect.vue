<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReferenceStore } from '../stores/reference'

const props = defineProps<{ modelValue: string[]; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const reference = useReferenceStore()

onMounted(() => reference.loadAll())

const selected = computed({
  get: () => props.modelValue,
  set: (value: string[]) => emit('update:modelValue', value),
})
</script>

<template>
  <b-field class="body-select" :label="label ?? 'Bodies'" label-position="on-border">
    <b-select multiple expanded native-size="8" v-model="selected">
      <option v-for="b in reference.bodies" :key="b.key" :value="b.key" :disabled="!b.available">
        {{ b.name }} ({{ b.key }}){{ b.available ? '' : ' — unavailable' }}
      </option>
    </b-select>
  </b-field>
</template>
