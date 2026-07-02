<script setup lang="ts">
defineProps<{
  correct: boolean
  explanation: string | null
}>()

defineEmits<{ next: [] }>()
</script>

<template>
  <div class="feedback" :class="correct ? 'feedback--correct' : 'feedback--incorrect'" aria-live="polite">
    <p class="feedback-title">{{ correct ? 'Correto!' : 'Incorreto!' }}</p>
    <p v-if="explanation" class="feedback-explanation">{{ explanation }}</p>
    <button type="button" class="feedback-next" @click="$emit('next')">Próxima pergunta</button>
  </div>
</template>

<style scoped>
.feedback {
  margin-top: 20px;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid;
}

.feedback--correct {
  background: rgba(45, 106, 79, 0.1);
  border-color: #2d6a4f;
}

.feedback--incorrect {
  background: rgba(179, 38, 30, 0.08);
  border-color: #b3261e;
}

.feedback-title {
  font-family: 'Merriweather', serif;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--pg-heading);
}

.feedback-explanation {
  font-size: 14px;
  line-height: 1.6;
  color: var(--pg-text);
  margin: 0 0 16px;
}

.feedback-next {
  padding: 10px 20px;
  background: var(--pg-accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.feedback-next:hover {
  opacity: 0.85;
}
</style>
