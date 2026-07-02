<script setup lang="ts">
const props = defineProps<{ quizType: QuizType }>()

const { startQuiz } = useQuiz()

const options: { value: QuizDifficulty | null; label: string; description: string }[] = [
  { value: null, label: 'Todas', description: 'Mistura perguntas de todos os níveis' },
  { value: 'facil', label: 'Fácil', description: 'Para quem está começando' },
  { value: 'medio', label: 'Médio', description: 'Um bom desafio' },
  { value: 'dificil', label: 'Difícil', description: 'Só para especialistas' },
]

function choose(value: QuizDifficulty | null) {
  startQuiz(props.quizType, value)
}
</script>

<template>
  <div class="difficulty-selector">
    <h1 class="difficulty-title">Escolha a dificuldade</h1>
    <div class="difficulty-grid">
      <button
        v-for="option in options"
        :key="option.label"
        type="button"
        class="difficulty-card"
        @click="choose(option.value)"
      >
        <span class="difficulty-label">{{ option.label }}</span>
        <span class="difficulty-description">{{ option.description }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.difficulty-selector {
  max-width: 640px;
  margin: 0 auto;
  padding: 60px 24px;
  text-align: center;
}

.difficulty-title {
  font-family: 'Merriweather', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--pg-heading);
  margin: 0 0 32px;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 640px) {
  .difficulty-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.difficulty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 22px 18px;
  background: var(--pg-card-bg);
  border: 1.5px solid var(--pg-card-border);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.difficulty-card:hover {
  transform: translateY(-3px);
  border-color: var(--pg-accent);
}

.difficulty-label {
  font-family: 'Merriweather', serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--pg-card-title);
  margin-bottom: 6px;
}

.difficulty-description {
  font-size: 13px;
  color: var(--pg-card-excerpt);
}
</style>
