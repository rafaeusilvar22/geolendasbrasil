<script setup lang="ts">
import type { AdminQuizQuestion } from '~/composables/useQuiz'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const client = useSupabaseClient()
const id = Number(route.params.id)

const { data: question } = await useAsyncData<AdminQuizQuestion | null>(`admin-quiz-question-${id}`, async () => {
  const { data } = await client.from('quiz_questions').select('*').eq('id', id).single()
  return data
})

const { data: articles } = await useAsyncData<{ id: number, title: string }[]>('form-articles-picker', async () => {
  const { data } = await client.from('articles').select('id, title').order('title')
  return data ?? []
})

if (!question.value) {
  throw createError({ statusCode: 404, statusMessage: 'Pergunta não encontrada' })
}

useHead({ title: 'Editar pergunta — Admin' })
</script>

<template>
  <AdminQuizQuestionFormPage
    mode="edit"
    :question="question ?? undefined"
    :articles="articles ?? []"
  />
</template>
