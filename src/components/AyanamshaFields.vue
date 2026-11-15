<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReferenceStore } from '../stores/reference'

export interface AyanamshaFormValue {
  aya: string[]
  sid: boolean
}

const props = defineProps<{ modelValue: AyanamshaFormValue; showSidereal?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [AyanamshaFormValue] }>()
const reference = useReferenceStore()

onMounted(() => reference.loadAll())

const selected = computed({
  get: () => props.modelValue.aya,
  set: (value: string[]) => emit('update:modelValue', { ...props.modelValue, aya: value }),
})

const sidereal = computed({
  get: () => props.modelValue.sid,
  set: (value: boolean) => emit('update:modelValue', { ...props.modelValue, sid: value }),
})
</script>

<template>
  <b-field class="ayanamsha-fields" label="Ayanamshas" grouped group-multiline>
    <b-field label-position="on-border">
      <b-select size="is-small" multiple expanded native-size="6" v-model="selected">
        <option v-for="a in reference.ayanamshas" :key="a.key" :value="a.key">{{ a.name }}</option>
      </b-select>
    </b-field>
    <b-field v-if="showSidereal">
      <b-checkbox size="is-small" v-model="sidereal">Subtract first selected ayanamsha (sidereal)</b-checkbox>
    </b-field>
  </b-field>
</template>
