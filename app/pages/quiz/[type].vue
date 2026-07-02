<script setup lang="ts">
const VALID_TYPES: QuizType[] = ['adivinhe_lenda', 'qual_caracteristica', 'qual_estado']
const TITLE_MAP: Record<QuizType, string> = {
  adivinhe_lenda: 'Adivinhe a Lenda',
  qual_caracteristica: 'Qual Característica?',
  qual_estado: 'De Qual Estado?',
}

const route = useRoute()
const quizType = route.params.type as QuizType

if (!VALID_TYPES.includes(quizType)) {
  throw createError({ statusCode: 404, statusMessage: 'Quiz não encontrado' })
}

const { resetQuiz } = useQuiz()
resetQuiz()

const SITE_URL = 'https://geolendasbrasil.netlify.app'
useSeoMeta({
  title: `Quiz: ${TITLE_MAP[quizType]} — GeoLendas Brasil`,
  description: 'Teste seus conhecimentos sobre lendas, folclore e geografia do Brasil.',
  ogUrl: `${SITE_URL}/quiz/${quizType}`,
  ogType: 'website',
})
useHead({ link: [{ rel: 'canonical', href: `${SITE_URL}/quiz/${quizType}` }] })
</script>

<template>
  <div class="page-root">
    <QuizContainer :quiz-type="quizType" />
  </div>
</template>

<style scoped>
.page-root {
  min-height: 100vh;
  background: var(--pg-bg);
  transition: background 0.3s ease, color 0.3s ease;
}
</style>
