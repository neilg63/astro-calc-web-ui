<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AspectDef } from '../stores/preferences'
import { aspectByAngle, aspectLabel, aspects, suggestedOrb } from '../lib/aspects'

const props = defineProps<{ modelValue: AspectDef[] }>()
const emit = defineEmits<{ 'update:modelValue': [AspectDef[]] }>()

/** Aspects not yet in the list, most important first. */
const available = computed(() =>
  aspects.filter((a) => !props.modelValue.some((row) => aspectByAngle(row.angle)?.key === a.key)).sort((a, b) => a.weight - b.weight),
)

const toAdd = ref('')
watch(
  available,
  (list) => {
    if (!list.some((a) => a.key === toAdd.value)) toAdd.value = list[0]?.key ?? ''
  },
  { immediate: true },
)

function addRow() {
  const aspect = aspects.find((a) => a.key === toAdd.value)
  if (!aspect) return
  emit('update:modelValue', [...props.modelValue, { angle: aspect.deg, orb: suggestedOrb(aspect.key) }])
}

function removeRow(index: number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index),
  )
}

function updateOrb(index: number, orb: number) {
  emit(
    'update:modelValue',
    props.modelValue.map((row, i) => (i === index ? { ...row, orb } : row)),
  )
}
</script>

<template>
  <b-field label="Aspects (orb in degrees)" class="aspect-orbs-editor">
    <div class="aspect-orbs-list">
      <div v-for="(row, i) in modelValue" :key="row.angle" class="aspect-orbs-row">
        <span class="aspect-orbs-name">{{ aspectLabel(row.angle) }}</span>
        <b-numberinput
          class="aspect-orbs-orb"
          :model-value="row.orb"
          @update:model-value="(v: number) => updateOrb(i, v)"
          :step="0.5"
          :min="0.1"
          :controls="false"
          size="is-small"
        />
        <b-button class="aspect-orbs-remove" type="is-danger" size="is-small" outlined icon-left="minus" :aria-label="`Remove ${aspectLabel(row.angle)}`" @click="removeRow(i)" />
      </div>
      <div v-if="available.length" class="aspect-orbs-row aspect-orbs-add-row">
        <b-select class="aspect-orbs-select" v-model="toAdd" size="is-small" aria-label="Aspect to add">
          <option v-for="a in available" :key="a.key" :value="a.key">{{ aspectLabel(a.deg) }}</option>
        </b-select>
        <b-button class="aspect-orbs-add" type="is-primary" size="is-small" outlined icon-left="plus" aria-label="Add aspect" @click="addRow" />
      </div>
    </div>
  </b-field>
</template>
