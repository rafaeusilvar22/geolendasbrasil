<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const client = useSupabaseClient()

const { data: articles } = await useAsyncData<{ id: number, title: string }[]>('form-articles-picker', async () => {
  const { data } = await client.from('articles').select('id, title').order('title')
  return data ?? []
})

useHead({ title: 'Nova pergunta — Admin' })
</script>

<template>
  <AdminQuizQuestionFormPage mode="create" :articles="articles ?? []" />
</template>
