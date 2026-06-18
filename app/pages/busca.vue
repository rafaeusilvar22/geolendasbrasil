<script setup lang="ts">
import type { Article } from '~/types/article'

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()

const q = computed(() => (route.query.q as string) ?? '')
const searchInput = ref(q.value)

const { data: results, pending } = await useAsyncData<Article[]>(
  () => `busca-${q.value}`,
  async () => {
    if (!q.value.trim()) return []
    const { data } = await client
      .from('articles')
      .select('*, category:categories(*)')
      .eq('published', true)
      .or(`title.ilike.%${q.value}%,excerpt.ilike.%${q.value}%`)
      .order('created_at', { ascending: false })
    return data ?? []
  },
  { watch: [q] }
)

watch(q, (val) => { searchInput.value = val })

function refineSearch() {
  const term = searchInput.value.trim()
  if (!term) return
  router.push({ path: '/busca', query: { q: term } })
}

const SITE_URL = 'https://geolendasbrasil.netlify.app'
useSeoMeta({
  title: q.value ? `Busca: "${q.value}" — GeoLendas Brasil` : 'Busca — GeoLendas Brasil',
  description: 'Pesquise artigos sobre história, lendas e cultura dos estados brasileiros.',
  ogUrl: `${SITE_URL}/busca`,
})
useHead({ link: [{ rel: 'canonical', href: `${SITE_URL}/busca` }] })
</script>

<template>
  <div class="page-root">
    <div class="search-hero">
      <div class="search-hero-content">
        <h1 class="search-title">Busca</h1>
        <form class="search-form" @submit.prevent="refineSearch">
          <div class="search-field">
            <Icon name="heroicons:magnifying-glass" class="search-icon" />
            <input
              v-model="searchInput"
              class="search-input"
              placeholder="Buscar artigos..."
              autofocus
            />
          </div>
          <button type="submit" class="search-btn">Buscar</button>
        </form>
      </div>
    </div>

    <div class="content">
      <div v-if="q" class="results-header">
        <p v-if="pending" class="results-count">Buscando...</p>
        <p v-else class="results-count">
          <template v-if="results && results.length > 0">
            {{ results.length }} resultado{{ results.length !== 1 ? 's' : '' }} para
            <strong>"{{ q }}"</strong>
          </template>
          <template v-else>
            Nenhum resultado para <strong>"{{ q }}"</strong>
          </template>
        </p>
      </div>

      <div v-if="results && results.length > 0" class="articles-grid">
        <ArticleCard
          v-for="article in results"
          :key="article.id"
          :article="article"
        />
      </div>

      <div v-else-if="!pending && q" class="empty-state">
        <Icon name="heroicons:face-frown" class="empty-icon" />
        <p class="empty-title">Nenhum artigo encontrado</p>
        <p class="empty-text">Tente outras palavras-chave ou navegue pelas categorias.</p>
        <NuxtLink to="/" class="back-link">Ver todos os artigos</NuxtLink>
      </div>

      <div v-else-if="!q" class="empty-state">
        <Icon name="heroicons:magnifying-glass" class="empty-icon" />
        <p class="empty-title">O que você quer descobrir?</p>
        <p class="empty-text">Digite um termo acima para buscar artigos sobre história, lendas e cultura do Brasil.</p>
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

.search-hero {
  padding: 64px 40px 48px;
  background: var(--pg-hero-bg);
  color: var(--pg-hero-text);
  text-align: center;
}

.search-hero-content {
  max-width: 640px;
  margin: 0 auto;
}

.search-title {
  font-family: 'Merriweather', serif;
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 28px 0;
  line-height: 1.2;
}

.search-form {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-field {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--pg-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 48px;
  padding: 0 16px 0 42px;
  background: var(--pg-bg);
  border: 1.5px solid var(--pg-border, rgba(0,0,0,0.15));
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: var(--pg-text);
  outline: none;
  transition: border-color 0.2s ease;
}
.search-input::placeholder {
  color: var(--pg-text-muted);
}
.search-input:focus {
  border-color: #d4845c;
}

.search-btn {
  height: 48px;
  padding: 0 24px;
  background: #d4845c;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease;
}
.search-btn:hover {
  background: #c0714a;
}

.content {
  padding: 40px 40px 48px;
  max-width: 1400px;
  margin: 0 auto;
}

.results-header {
  margin-bottom: 28px;
}

.results-count {
  font-size: 15px;
  color: var(--pg-text-muted);
  margin: 0;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--pg-text-muted);
  opacity: 0.5;
}

.empty-title {
  font-family: 'Merriweather', serif;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--pg-text);
}

.empty-text {
  font-size: 16px;
  color: var(--pg-text-muted);
  margin: 0;
  max-width: 420px;
  line-height: 1.6;
}

.back-link {
  display: inline-block;
  margin-top: 8px;
  color: #d4845c;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s ease;
}
.back-link:hover {
  opacity: 0.8;
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
  .search-hero {
    padding: 40px 16px 32px;
  }

  .search-title {
    font-size: 30px;
    margin-bottom: 20px;
  }

  .search-form {
    flex-direction: column;
    gap: 8px;
  }

  .search-field {
    width: 100%;
  }

  .search-btn {
    width: 100%;
  }

  .content {
    padding: 28px 16px 40px;
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
