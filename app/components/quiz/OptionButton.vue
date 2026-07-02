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
  background: rgba(212, 132, 92, 0.08);
}

.option-btn--correct {
  border-color: #2d6a4f;
  background: rgba(45, 106, 79, 0.12);
  color: #2d6a4f;
}

.option-btn--incorrect {
  border-color: #b3261e;
  background: rgba(179, 38, 30, 0.1);
  color: #b3261e;
}
</style>
