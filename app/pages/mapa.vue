<script setup lang="ts">
import type { Article, CategoryGroup } from '~/types/article'

const client = useSupabaseClient()

const { data: articles } = await useAsyncData<Article[]>('mapa-articles', async () => {
  const { data } = await client
    .from('articles')
    .select('*, category:categories(*)')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data ?? []
})

const selectedState = ref<string | null>(null)
const articlesColRef = ref<HTMLElement | null>(null)
const expandedCategories = ref<Set<number>>(new Set())

function expandCategory(id: number) {
  expandedCategories.value = new Set([...expandedCategories.value, id])
}

watch(selectedState, (newState) => {
  expandedCategories.value = new Set()
  if (!newState) return
  if (!newState) return
  nextTick(() => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      articlesColRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

const articleCountByState = computed(() => {
  const counts: Record<string, number> = {}
  for (const a of articles.value ?? []) {
    if (a.state) counts[a.state] = (counts[a.state] ?? 0) + 1
  }
  return counts
})

const statesWithArticles = computed(() => Object.keys(articleCountByState.value))

const articlesByCategory = computed<CategoryGroup[]>(() => {
  if (!selectedState.value) return []
  const grouped: Record<number, CategoryGroup> = {}
  for (const a of articles.value ?? []) {
    if (a.state !== selectedState.value || !a.category_id || !a.category) continue
    const group = grouped[a.category_id] ?? { category: a.category, articles: [] }
    grouped[a.category_id] = group
    group.articles.push(a)
  }
  return Object.values(grouped).sort((a, b) => a.category.sort_order - b.category.sort_order)
})

const SITE_URL = 'https://geolendasbrasil.netlify.app'
useSeoMeta({
  title: 'Mapa Interativo — GeoLendas Brasil',
  description: 'Explore as histórias, lendas e tradições do Brasil estado por estado. Clique no mapa para descobrir.',
  ogTitle: 'Mapa Interativo — GeoLendas Brasil',
  ogDescription: 'Explore as histórias, lendas e tradições do Brasil estado por estado.',
  ogUrl: `${SITE_URL}/mapa`,
  ogType: 'website',
})
useHead({ link: [{ rel: 'canonical', href: `${SITE_URL}/mapa` }] })
</script>

<template>
  <div class="page-root">
    <div class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">Mapa Interativo</h1>
        <p class="hero-subtitle">
          Explore as histórias, lendas e tradições do Brasil estado por estado.
          <span class="hero-stat">{{ statesWithArticles.length }} estados com conteúdo.</span>
        </p>
      </div>
    </div>

    <div class="content">
      <div class="map-layout">
        <div class="map-col">
          <BrazilMap
            :states-with-articles="statesWithArticles"
            :selected-state="selectedState"
            :article-count-by-state="articleCountByState"
            @select="selectedState = $event"
          />
          <div class="map-legend">
            <div class="legend-item">
              <span class="legend-dot legend-dot--active" />
              <span>Com artigos</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--empty" />
              <span>Sem artigos ainda</span>
            </div>
          </div>
        </div>

        <div ref="articlesColRef" class="articles-col">
          <div v-if="!selectedState" class="instruction">
            <div class="instruction-icon">🗺️</div>
            <p class="instruction-text">
              Clique em um estado no mapa para explorar suas histórias, lendas e tradições.
            </p>
            <p class="instruction-hint">
              Os estados em verde têm artigos publicados.
            </p>
          </div>

          <template v-else>
            <div class="state-header">
              <button class="back-btn" @click="selectedState = null">
                ← Todos os estados
              </button>
              <h2 class="state-title">{{ selectedState }}</h2>
              <p class="state-count">
                {{ articleCountByState[selectedState] ?? 0 }}
                {{ (articleCountByState[selectedState] ?? 0) === 1 ? 'artigo' : 'artigos' }}
              </p>
            </div>

            <div v-if="articlesByCategory.length === 0" class="empty-state">
              <p class="empty-state-text">Nenhum artigo publicado para este estado ainda.</p>
            </div>

            <div
              v-for="group in articlesByCategory"
              :key="group.category.id"
              class="category-group"
            >
              <div class="category-header">
                <h3 class="category-title">{{ group.category.name }}</h3>
                <p class="category-count">
                  {{ group.articles.length }}
                  {{ group.articles.length === 1 ? 'artigo' : 'artigos' }}
                </p>
              </div>
              <div class="articles-grid">
                <ArticleCard
                  v-for="article in (expandedCategories.has(group.category.id) ? group.articles : group.articles.slice(0, 2))"
                  :key="article.id"
                  :article="article"
                />
              </div>
              <button
                v-if="group.articles.length > 2 && !expandedCategories.has(group.category.id)"
                class="see-more-btn"
                @click="expandCategory(group.category.id)"
              >
                Ver mais {{ group.articles.length - 2 }} artigo{{ group.articles.length - 2 !== 1 ? 's' : '' }} →
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <footer class="footer">
      <p class="footer-text">
        GeoLendas Brasil © {{ new Date().getFullYear() }} | Preservando histórias, celebrando culturas
      </p>
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
  padding: 64px 40px;
  background: var(--pg-hero-bg);
  text-align: center;
  color: var(--pg-hero-text);
}

.hero-inner {
  max-width: 760px;
  margin: 0 auto;
}

.hero-title {
  font-family: 'Merriweather', serif;
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 20px 0;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 18px;
  font-weight: 400;
  margin: 0;
  opacity: 0.85;
  line-height: 1.6;
}

.hero-stat {
  display: inline-block;
  margin-left: 4px;
  opacity: 0.7;
  font-size: 16px;
}

.content {
  padding: 48px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.map-layout {
  display: grid;
  grid-template-columns: 480px 1fr;
  gap: 56px;
  align-items: start;
}

.map-col {
  position: sticky;
  top: 80px;
}

.map-legend {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  padding-left: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--pg-text-muted);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-dot--active {
  background: var(--pg-map-active);
}

.legend-dot--empty {
  background: var(--pg-map-empty);
}

.articles-col {
  min-height: 400px;
}

.instruction {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 64px 32px;
  border: 1px dashed var(--pg-filter-border);
  border-radius: 16px;
  min-height: 360px;
}

.instruction-icon {
  font-size: 48px;
  margin-bottom: 20px;
  line-height: 1;
}

.instruction-text {
  font-size: 18px;
  color: var(--pg-heading);
  font-family: 'Merriweather', serif;
  line-height: 1.6;
  margin: 0 0 12px 0;
  max-width: 400px;
}

.instruction-hint {
  font-size: 14px;
  color: var(--pg-text-muted);
  margin: 0;
}

.state-header {
  margin-bottom: 36px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--pg-section-border);
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--pg-text-muted);
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  padding: 0;
  margin-bottom: 12px;
  display: block;
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: var(--pg-accent);
}

.state-title {
  font-family: 'Merriweather', serif;
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: var(--pg-heading);
}

.state-count {
  font-size: 14px;
  color: var(--pg-text-muted);
  margin: 0;
}

.category-group {
  margin-bottom: 56px;
}

.category-header {
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--pg-section-border);
}

.category-title {
  font-family: 'Merriweather', serif;
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--pg-heading);
  text-transform: capitalize;
}

.category-count {
  font-size: 12px;
  color: var(--pg-text-muted);
  margin: 0;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.see-more-btn {
  margin-top: 16px;
  background: transparent;
  border: 1px solid var(--pg-filter-border);
  border-radius: 20px;
  color: var(--pg-filter-text);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.see-more-btn:hover {
  border-color: var(--pg-accent);
  color: var(--pg-accent);
  background: rgba(212, 132, 92, 0.08);
}

.empty-state {
  text-align: center;
  padding: 64px 32px;
  border: 1px dashed var(--pg-filter-border);
  border-radius: 16px;
}

.empty-state-text {
  font-size: 16px;
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

@media (max-width: 1024px) {
  .map-layout {
    grid-template-columns: 380px 1fr;
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .map-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .map-col {
    position: static;
  }

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

  .instruction {
    padding: 40px 20px;
    min-height: 240px;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  .footer {
    padding: 40px 16px 32px;
  }
}
</style>
