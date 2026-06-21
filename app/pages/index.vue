<script setup lang="ts">
import type { Article, CategoryGroup } from '~/types/article'

const client = useSupabaseClient()

const { data: articles } = await useAsyncData<Article[]>('homepage-articles', async () => {
  const { data } = await client
    .from('articles')
    .select('id, title, excerpt, content, state, category_id, type, slug, published, created_at, updated_at, category:categories(*)')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data ?? []
})

const PREVIEW_COUNT = 4

const expandedCategories = reactive(new Set<number>())

const allGroups = computed<CategoryGroup[]>(() => {
  const filtered = (articles.value ?? []).filter((a) => a.category?.show_in_home)

  const grouped: Record<number, CategoryGroup> = {}
  filtered.forEach((a) => {
    if (!a.category_id || !a.category) return
    const group = grouped[a.category_id] ?? { category: a.category, articles: [] }
    grouped[a.category_id] = group
    group.articles.push(a)
  })

  return Object.values(grouped).sort(
    (a, b) => a.category.sort_order - b.category.sort_order,
  )
})

const SITE_URL = 'https://geolendasbrasil.netlify.app'
useSeoMeta({
  title: 'GeoLendas Brasil',
  description: 'Histórias, lendas, tradições e geografia que moldaram cada estado do Brasil. Explore a magia ancestral das nossas terras.',
  ogTitle: 'GeoLendas Brasil',
  ogDescription: 'Histórias, lendas, tradições e geografia que moldaram cada estado do Brasil.',
  ogUrl: `${SITE_URL}/`,
  ogType: 'website',
  ogImage: `${SITE_URL}/icon-512x512.png`,
  twitterCard: 'summary',
})
useHead({ link: [{ rel: 'canonical', href: `${SITE_URL}/` }] })
</script>

<template>
  <div class="page-root">
    <div class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">GeoLendas Brasil</h1>
        <p class="hero-subtitle">
          Histórias, lendas, tradições e geografia que moldaram cada estado do Brasil. Explore a
          magia ancestral das nossas terras.
        </p>
      </div>
    </div>

    <div class="content">
      <div v-for="group in allGroups" :key="group.category.id" class="category-group">
        <div class="category-header">
          <h2 class="category-title">{{ group.category.name }}</h2>
          <p class="category-count">
            {{ group.articles.length }}
            {{ group.articles.length === 1 ? 'artigo' : 'artigos' }}
          </p>
        </div>

        <div class="articles-grid">
          <ArticleCard
            v-for="article in expandedCategories.has(group.category.id) ? group.articles : group.articles.slice(0, PREVIEW_COUNT)"
            :key="article.id"
            :article="article"
          />
        </div>

        <div v-if="group.articles.length > PREVIEW_COUNT" class="see-more">
          <button
            v-if="!expandedCategories.has(group.category.id)"
            class="see-more-btn"
            @click="expandedCategories.add(group.category.id)"
          >
            Ver mais {{ group.articles.length - PREVIEW_COUNT }} {{ group.articles.length - PREVIEW_COUNT === 1 ? 'artigo' : 'artigos' }}
          </button>
          <button
            v-else
            class="see-more-btn see-more-btn--collapse"
            @click="expandedCategories.delete(group.category.id)"
          >
            Ver menos
          </button>
        </div>
      </div>

      <div v-if="allGroups.length === 0" class="empty-state">
        <p class="empty-state-text">Nenhum artigo encontrado. Tente ajustar seus filtros.</p>
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

.hero {
  padding: 80px 40px;
  background: var(--pg-hero-bg);
  text-align: center;
  color: var(--pg-hero-text);
}

.hero-inner {
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-family: 'Merriweather', serif;
  font-size: 56px;
  font-weight: 700;
  margin: 0 0 24px 0;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 18px;
  font-weight: 400;
  margin: 0;
  opacity: 0.85;
  line-height: 1.6;
}

.content {
  padding: 48px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.category-group {
  margin-bottom: 72px;
}

.category-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--pg-section-border);
}

.category-title {
  font-family: 'Merriweather', serif;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: var(--pg-heading);
  text-transform: capitalize;
}

.category-count {
  font-size: 13px;
  color: var(--pg-text-muted);
  margin: 6px 0 0 0;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.see-more {
  margin-top: 32px;
  text-align: center;
}

.see-more-btn {
  padding: 12px 32px;
  background: transparent;
  border: 1.5px solid var(--pg-filter-border);
  border-radius: 24px;
  color: var(--pg-filter-text);
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}
.see-more-btn:hover {
  background: var(--pg-filter-active-bg);
  border-color: var(--pg-filter-active-bg);
  color: var(--pg-filter-active-text);
}
.see-more-btn--collapse {
  font-weight: 400;
  font-size: 13px;
  opacity: 0.7;
}
.see-more-btn--collapse:hover {
  background: transparent;
  border-color: var(--pg-filter-border);
  color: var(--pg-filter-text);
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
}

.empty-state-text {
  font-size: 18px;
  margin: 0;
  color: var(--pg-text-muted);
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
  .hero {
    padding: 48px 16px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 16px;
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
