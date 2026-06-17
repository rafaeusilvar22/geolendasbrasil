<script setup lang="ts">
import type { Category } from '~/types/article'

definePageMeta({ layout: 'admin' })

const client = useSupabaseClient()

const { data: categories } = await useAsyncData<Category[]>('form-categories', async () => {
  const { data } = await client.from('categories').select('*').order('sort_order')
  return data ?? []
})

useHead({ title: 'Novo artigo — Admin' })
</script>

<template>
  <AdminArticleFormPage mode="create" :categories="categories ?? []" />
</template>
