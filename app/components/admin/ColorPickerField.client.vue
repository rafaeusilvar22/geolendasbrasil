<script setup lang="ts">
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const pickerContainer = ref<string | HTMLElement>('body')

const hexColor = computed({
  get: () => `#${props.modelValue || '000000'}`,
  set: (value: string) => emit('update:modelValue', value.replace('#', '').toUpperCase())
})

function updateContainer(event: MouseEvent) {
  // The popup teleports into this container. Native <dialog> promotes itself
  // to the browser's top layer, so a container outside of it (e.g. <body>)
  // would always paint behind the modal regardless of z-index. Resolved on
  // every mousedown (before the click that opens the popup) so it stays
  // correct even if this field gets moved between dialogs.
  const target = event.currentTarget as HTMLElement
  pickerContainer.value = target.closest('dialog') ?? 'body'
}
</script>

<template>
  <div class="color-picker-field" @mousedown.capture="updateContainer">
    <ColorPicker
      v-model:pure-color="hexColor"
      :picker-container="pickerContainer"
      shape="circle"
      picker-type="chrome"
      format="hex6"
      disable-alpha
      disable-history
    />
    <span class="color-picker-hex">{{ hexColor.toUpperCase() }}</span>
  </div>
</template>

<style scoped>
.color-picker-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker-field :deep(.vc-color-wrap) {
  width: 32px;
  height: 32px;
  margin-right: 0;
  border: 2px solid var(--adm-border);
  cursor: pointer;
  flex-shrink: 0;
}

.color-picker-hex {
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: var(--adm-text);
  text-transform: uppercase;
}
</style>
