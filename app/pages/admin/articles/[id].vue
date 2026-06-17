<script setup lang="ts">
import type { Article, Category } from '~/types/article'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const client = useSupabaseClient()
const id = Number(route.params.id)

const { data: article } = await useAsyncData<Article | null>(`admin-article-${id}`, async () => {
  const { data } = await client.from('articles').select('*').eq('id', id).single()
  return data
})

const { data: categories } = await useAsyncData<Category[]>('form-categories', async () => {
  const { data } = await client.from('categories').select('*').order('sort_order')
  return data ?? []
})

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Artigo não encontrado' })
}

useHead({ title: `Editar: ${article.value?.title} — Admin` })
</script>

<template>
  <AdminArticleFormPage
    mode="edit"
    :article="article ?? undefined"
    :categories="categories ?? []"
  />
</template>
