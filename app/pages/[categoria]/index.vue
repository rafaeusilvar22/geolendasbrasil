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
    .select('id, title, excerpt, content, state, category_id, type, slug, published, has_audio, created_at, updated_at, category:categories(id,name,slug,gradient)')
    .eq('category_id', category.value!.id)
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data ?? []
})

const SITE_URL = 'https://geolendasbrasil.netlify.app'
const canonicalUrl = `${SITE_URL}/${slug}`
useSeoMeta({
  title: `${category.value!.name} — GeoLendas Brasil`,
  description: category.value!.description ?? `Explore ${category.value!.name.toLowerCase()} dos estados brasileiros: histórias, tradições e cultura.`,
  ogTitle: `${category.value!.name} — GeoLendas Brasil`,
  ogDescription: category.value!.description ?? `Explore ${category.value!.name.toLowerCase()} dos estados brasileiros.`,
  ogUrl: canonicalUrl,
  ogType: 'website',
  ogImage: `${SITE_URL}/icon-512x512.png`,
  twitterCard: 'summary',
})
useHead({ link: [{ rel: 'canonical', href: canonicalUrl }] })
</script>

<template>
  <div class="page-root">
    <div class="category-hero">
      <div
        class="category-hero-bg"
        :style="{
          '--gradient-from': `#${category?.gradient?.[0] ?? '2D6A4F'}`,
          '--gradient-to': `#${category?.gradient?.[1] ?? '8B6F47'}`,
        }"
      />
      <div class="category-hero-content">
        <h1 class="category-title">{{ category?.name }}</h1>
        <p v-if="category?.description" class="category-description">
          {{ category?.description }}
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
  background: var(--pg-bg);
  font-family: 'Inter', sans-serif;
  color: var(--pg-text);
  transition: background 0.3s ease, color 0.3s ease;
}

.category-hero {
  position: relative;
  padding: 80px 40px;
  background: var(--pg-hero-bg);
  text-align: center;
  overflow: hidden;
  color: var(--pg-hero-text);
}

.category-hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-to) 100%);
  opacity: 0.25;
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
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
}

.empty-state-text {
  font-size: 18px;
  color: var(--pg-text-muted);
  margin: 0;
}

.footer {
  padding: 48px 40px 40px;
  background: var(--pg-hero-bg);
  text-align: center;
  font-size: 14px;
  color: var(--pg-hero-muted);
}

.footer-text {
  margin: 0;
}

@media (max-width: 640px) {
  .category-hero {
    padding: 48px 16px;
  }

  .category-title {
    font-size: 36px;
  }

  .content {
    padding: 32px 16px;
  }

  .articles-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .empty-state {
    padding: 48px 16px;
  }

  .footer {
    padding: 40px 16px 32px;
  }
}
</style>
