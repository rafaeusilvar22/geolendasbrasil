<script setup lang="ts">
defineProps<{
  label: string
  state: 'idle' | 'selected' | 'correct' | 'incorrect'
  disabled: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="state === 'selected' || state === 'correct'"
    :aria-label="label"
    class="option-btn"
    :class="`option-btn--${state}`"
    :disabled="disabled"
    @click="$emit('click')"
  >
    {{ label }}
  </button>
</template>

<style scoped>
.option-btn {
  width: 100%;
  padding: 16px 18px;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--pg-text);
  background: var(--pg-card-bg);
  border: 1.5px solid var(--pg-card-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.1s ease, background 0.15s ease;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--pg-accent);
  transform: translateY(-1px);
}

.option-btn:disabled {
  cursor: default;
}

.option-btn--selected {
  border-color: var(--pg-accent);
  background: rgba(201, 162, 75, 0.08);
}

.option-btn--correct {
  border-color: #4B6B5C;
  background: rgba(75, 107, 92, 0.12);
  color: #4B6B5C;
}

.option-btn--incorrect {
  border-color: #7C2D3B;
  background: rgba(124, 45, 59, 0.1);
  color: #7C2D3B;
}
</style>
