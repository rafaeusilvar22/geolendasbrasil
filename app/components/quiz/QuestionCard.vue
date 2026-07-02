<script setup lang="ts">
const { currentQuestion, progress, answered, answerQuestion, nextQuestion } = useQuiz()

const currentAnswer = computed(() =>
  answered.value.find((a) => a.question.id === currentQuestion.value?.id) ?? null,
)

function optionState(index: number): 'idle' | 'selected' | 'correct' | 'incorrect' {
  const answer = currentAnswer.value
  if (!answer) return 'idle'
  if (index === answer.question.correct_index) return 'correct'
  if (index === answer.selectedIndex) return 'incorrect'
  return 'idle'
}

function selectOption(index: number) {
  if (currentAnswer.value) return
  answerQuestion(index)
}
</script>

<template>
  <div v-if="currentQuestion" class="question-card">
    <div class="progress-header">
      <span class="progress-label">Pergunta {{ progress.current }} de {{ progress.total }}</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${(progress.current / progress.total) * 100}%` }" />
      </div>
    </div>

    <p class="question-text">{{ currentQuestion.question }}</p>

    <div class="options-grid" role="radiogroup" :aria-label="currentQuestion.question">
      <QuizOptionButton
        v-for="(option, index) in currentQuestion.options"
        :key="option"
        :label="option"
        :state="optionState(index)"
        :disabled="!!currentAnswer"
        @click="selectOption(index)"
      />
    </div>

    <QuizFeedbackOverlay
      v-if="currentAnswer"
      :correct="currentAnswer.correct"
      :explanation="currentQuestion.explanation"
      @next="nextQuestion"
    />
  </div>
</template>

<style scoped>
.question-card {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 24px;
}

.progress-header {
  margin-bottom: 28px;
}

.progress-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--pg-text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.progress-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--pg-card-divider);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--pg-accent);
  transition: width 0.3s ease;
}

.question-text {
  font-family: 'Merriweather', serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.5;
  color: var(--pg-heading);
  margin: 0 0 28px;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
