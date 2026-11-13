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
  <b-field label="Aspect definitions (angle / orb, degrees)" class="aspect-orbs-editor">
    <div v-for="(row, i) in modelValue" :key="i" class="aspect-orbs-row">
      <b-numberinput
        class="aspect-orbs-angle"
        :model-value="row.angle"
        @update:model-value="(v: number) => update(i, 'angle', v)"
        :step="1"
        :min="0"
        :max="360"
        :controls="false"
        size="is-small"
      />
      <b-numberinput
        class="aspect-orbs-orb"
        :model-value="row.orb"
        @update:model-value="(v: number) => update(i, 'orb', v)"
        :step="0.5"
        :min="0.1"
        :controls="false"
        size="is-small"
      />
      <b-button class="aspect-orbs-remove" type="is-danger" size="is-small" outlined icon-left="close" @click="removeRow(i)" />
    </div>
    <b-button class="aspect-orbs-add" type="is-primary" size="is-small" outlined icon-left="plus" @click="addRow">Add aspect</b-button>
  </b-field>
</template>
