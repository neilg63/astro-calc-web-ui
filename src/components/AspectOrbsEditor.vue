<script setup lang="ts">
import type { AspectDef } from '../stores/preferences'

const props = defineProps<{ modelValue: AspectDef[] }>()
const emit = defineEmits<{ 'update:modelValue': [AspectDef[]] }>()

function addRow() {
  emit('update:modelValue', [...props.modelValue, { angle: 0, orb: 8 }])
}

function removeRow(index: number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index),
  )
}

function update(index: number, key: 'angle' | 'orb', value: number) {
  const next = props.modelValue.map((row, i) => (i === index ? { ...row, [key]: value } : row))
  emit('update:modelValue', next)
}
</script>

<template>
  <b-field label="Aspect definitions (angle / orb, degrees)">
    <div v-for="(row, i) in modelValue" :key="i" class="aspect-row">
      <b-numberinput
        :model-value="row.angle"
        @update:model-value="(v: number) => update(i, 'angle', v)"
        :step="1"
        :min="0"
        :max="360"
        :controls="false"
        size="is-small"
      />
      <b-numberinput
        :model-value="row.orb"
        @update:model-value="(v: number) => update(i, 'orb', v)"
        :step="0.5"
        :min="0.1"
        :controls="false"
        size="is-small"
      />
      <b-button type="is-danger" size="is-small" outlined icon-left="close" @click="removeRow(i)" />
    </div>
    <b-button type="is-primary" size="is-small" outlined icon-left="plus" @click="addRow">Add aspect</b-button>
  </b-field>
</template>

<style scoped>
.aspect-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.4rem;
}
</style>
