<script setup lang="ts">
import type { Article, CategoryGroup, StateItem } from '~/types/article'

const client = useSupabaseClient()

const states: StateItem[] = [
  { id: 'Amazonas', name: 'Amazonas' },
  { id: 'Pará', name: 'Pará' },
  { id: 'Mato Grosso', name: 'Mato Grosso' },
  { id: 'Minas Gerais', name: 'Minas Gerais' },
  { id: 'São Paulo', name: 'São Paulo' },
  { id: 'Bahia', name: 'Bahia' },
  { id: 'Pernambuco', name: 'Pernambuco' },
  { id: 'Maranhão', name: 'Maranhão' },
  { id: 'Paraná', name: 'Paraná' },
  { id: 'Rio Grande do Sul', name: 'Rio Grande do Sul' },
]

const { data: categories } = await useCategories()

const { data: articles } = await useAsyncData<Article[]>('homepage-articles', async () => {
  const { data } = await client
    .from('articles')
    .select('*, category:categories(*)')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data ?? []
})

const selectedCategories = ref<number[]>([])
const selectedStates = ref<string[]>([])

const displayedCategories = computed<CategoryGroup[]>(() => {
  let filtered = articles.value ?? []

  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter((a) => selectedCategories.value.includes(a.category_id!))
  }

  if (selectedStates.value.length > 0) {
    filtered = filtered.filter((a) => selectedStates.value.includes(a.state))
  }

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

function toggleCategory(catId: number) {
  const idx = selectedCategories.value.indexOf(catId)
  if (idx >= 0) selectedCategories.value.splice(idx, 1)
  else selectedCategories.value.push(catId)
}

function toggleState(stateId: string) {
  const idx = selectedStates.value.indexOf(stateId)
  if (idx >= 0) selectedStates.value.splice(idx, 1)
  else selectedStates.value.push(stateId)
}

function clearFilters() {
  selectedCategories.value = []
  selectedStates.value = []
}

useHead({
  htmlAttrs: { 'data-theme': 'discovery' },
})
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
      <div class="filters">
        <div>
          <div class="filter-label-row">
            <span class="filter-label">Filtrar por categoria:</span>
            <button class="clear-btn" @click="clearFilters">Limpar filtros</button>
          </div>
          <div class="filter-chips">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="cat-btn"
              :class="{ 'cat-btn--active': selectedCategories.includes(cat.id) }"
              @click="toggleCategory(cat.id)"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <div>
          <span class="filter-label filter-label--block">Por estado:</span>
          <div class="filter-chips filter-chips--states">
            <button
              v-for="state in states"
              :key="state.id"
              class="state-btn"
              :class="{ 'state-btn--active': selectedStates.includes(state.id) }"
              @click="toggleState(state.id)"
            >
              {{ state.name }}
            </button>
          </div>
        </div>
      </div>

      <div v-for="group in displayedCategories" :key="group.category.id" class="category-group">
        <div class="category-header">
          <h2 class="category-title">{{ group.category.name }}</h2>
          <p class="category-count">
            {{ group.articles.length }}
            {{ group.articles.length === 1 ? 'artigo' : 'artigos' }}
          </p>
        </div>

        <div class="articles-grid">
          <ArticleCard
            v-for="article in group.articles"
            :key="article.id"
            :article="article"
          />
        </div>
      </div>

      <div v-if="displayedCategories.length === 0" class="empty-state">
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
  background: linear-gradient(to bottom right, #2d6a4f, #1b4332, #8b6f47);
  background-attachment: fixed;
  font-family: 'Inter', sans-serif;
  color: #f5f1e6;
}

.hero {
  position: relative;
  padding: 80px 40px;
  text-align: center;
  color: #f5f1e6;
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
  opacity: 0.95;
  line-height: 1.6;
}

.content {
  padding: 48px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.filters {
  margin-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-label-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-label {
  color: #f5f1e6;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.filter-label--block {
  display: block;
  margin-bottom: 16px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-chips--states {
  gap: 6px;
}

.clear-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(245, 241, 230, 0.6);
  border-radius: 20px;
  color: #f5f1e6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Inter', sans-serif;
}
.clear-btn:hover {
  background: rgba(245, 241, 230, 0.1);
}

.cat-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(245, 241, 230, 0.5);
  border-radius: 20px;
  color: #f5f1e6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
}
.cat-btn:hover:not(.cat-btn--active) {
  border-color: #d4845c;
  background: rgba(212, 132, 92, 0.15);
}
.cat-btn--active {
  background: #d4845c;
  border-color: #d4845c;
  font-weight: 600;
}

.state-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(245, 241, 230, 0.4);
  border-radius: 16px;
  color: #f5f1e6;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
}
.state-btn:hover:not(.state-btn--active) {
  border-color: #8b6f47;
  background: rgba(139, 111, 71, 0.15);
}
.state-btn--active {
  background: #8b6f47;
  border-color: #8b6f47;
  font-weight: 600;
}

.category-group {
  margin-bottom: 80px;
}

.category-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(212, 132, 92, 0.3);
}

.category-title {
  font-family: 'Merriweather', serif;
  font-size: 36px;
  font-weight: 700;
  margin: 0;
  color: #f5f1e6;
  text-transform: capitalize;
}

.category-count {
  font-size: 13px;
  color: rgba(245, 241, 230, 0.8);
  margin: 8px 0 0 0;
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
  margin: 0;
}

.footer {
  padding: 60px 40px 40px;
  border-top: 1px solid rgba(245, 241, 230, 0.1);
  text-align: center;
  font-size: 14px;
}

.footer-text {
  margin: 0;
}
</style>
