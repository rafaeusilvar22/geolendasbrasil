<script setup lang="ts">
import type { Article, Category } from '~/types/article'

const route = useRoute()
const client = useSupabaseClient()
const slug = route.params.categoria as string

const { data: category } = await useAsyncData<Category | null>(`category-${slug}`, async () => {
  const { data } = await client
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
})

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Categoria não encontrada' })
}

const { data: articles } = await useAsyncData<Article[]>(`articles-${slug}`, async () => {
  const { data } = await client
    .from('articles')
    .select('*, category:categories(id,name,slug,gradient)')
    .eq('category_id', category.value!.id)
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data ?? []
})

useHead({
  title: `${category.value?.name} — GeoLendas Brasil`,
  htmlAttrs: { 'data-theme': 'discovery' },
})
</script>

<template>
  <div class="page-root">
    <div class="category-hero">
      <div
        class="category-hero-bg"
        :style="{
          '--gradient-from': `#${category!.gradient[0]}`,
          '--gradient-to': `#${category!.gradient[1]}`,
        }"
      />
      <div class="category-hero-content">
        <h1 class="category-title">{{ category!.name }}</h1>
        <p v-if="category!.description" class="category-description">
          {{ category!.description }}
        </p>
      </div>
    </div>

    <div class="content">
      <div v-if="articles && articles.length > 0" class="articles-grid">
        <ArticleCard
          v-for="article in articles"
          :key="article.id"
          :article="article"
        />
      </div>

      <div v-else class="empty-state">
        <p class="empty-state-text">Nenhum artigo publicado nesta categoria ainda.</p>
      </div>
    </div>

    <footer class="footer">
      <p class="footer-text">GeoLendas Brasil © {{ new Date().getFullYear() }} | Preservando histórias, celebrando culturas</p>
    </footer>
  </div>
</template>

<style scoped>
.page-root {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #2d6a4f, #1b4332, #8b6f47);
  background-attachment: fixed;
  font-family: 'Inter', sans-serif;
  color: #f5f1e6;
}

.category-hero {
  position: relative;
  padding: 80px 40px;
  text-align: center;
  overflow: hidden;
}

.category-hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-to) 100%);
  opacity: 0.35;
}

.category-hero-content {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 auto;
}

.category-title {
  font-family: 'Merriweather', serif;
  font-size: 52px;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.category-description {
  font-size: 17px;
  opacity: 0.85;
  margin: 0;
  line-height: 1.6;
}

.content {
  padding: 48px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
}

.empty-state-text {
  font-size: 18px;
  opacity: 0.7;
  margin: 0;
}

.footer {
  padding: 60px 40px 40px;
  border-top: 1px solid rgba(245, 241, 230, 0.1);
  text-align: center;
  font-size: 14px;
  opacity: 0.7;
}

.footer-text {
  margin: 0;
}

@media (max-width: 640px) {
  .category-hero {
    padding: 60px 20px;
  }

  .category-title {
    font-size: 36px;
  }

  .content {
    padding: 32px 20px;
  }
}
</style>
