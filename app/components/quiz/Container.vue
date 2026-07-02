<script setup lang="ts">
const props = defineProps<{ quizType: QuizType }>()

const { status, questions } = useQuiz()
</script>

<template>
  <div class="quiz-container">
    <QuizDifficultySelector v-if="status === 'idle'" :quiz-type="props.quizType" />

    <div v-else-if="status === 'loading'" class="quiz-loading">Carregando perguntas...</div>

    <div v-else-if="status === 'finished' && questions.length === 0" class="quiz-empty">
      <p>Ainda não temos perguntas para este quiz e dificuldade. Tente outro nível.</p>
      <NuxtLink to="/quiz" class="btn-back">Voltar aos modos de quiz</NuxtLink>
    </div>

    <QuizQuestionCard v-else-if="status === 'playing'" />

    <QuizResultScreen v-else-if="status === 'finished'" :quiz-type="props.quizType" />
  </div>
</template>

<style scoped>
.quiz-loading,
.quiz-empty {
  max-width: 480px;
  margin: 0 auto;
  padding: 80px 24px;
  text-align: center;
  color: var(--pg-text-muted);
  font-size: 15px;
}

.btn-back {
  display: inline-block;
  margin-top: 16px;
  color: var(--pg-accent);
  font-weight: 600;
  text-decoration: none;
}
</style>
