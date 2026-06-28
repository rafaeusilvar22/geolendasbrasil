<script setup lang="ts">
interface Suggestion {
  id: number
  title: string
  slug: string
  category: { slug: string; name: string } | null
}

const { data: categories } = await useCategories()
const { theme, toggle } = useTheme()
const router = useRouter()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()

const links = computed(() => [
  { label: 'Início', to: '/' },
  { label: 'Mapa', to: '/mapa' },
  ...(categories.value ?? []).filter((c) => c.show_in_nav).map((c) => ({ label: c.name, to: `/${c.slug}` })),
])

const menuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const suggestions = ref<Suggestion[]>([])
const showSuggestions = ref(false)

let suggestTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
  clearTimeout(suggestTimeout)
  if (val.trim().length < 2) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  suggestTimeout = setTimeout(async () => {
    const { data } = await client
      .from('articles')
      .select('id, title, slug, category:categories(slug, name)')
      .eq('published', true)
      .ilike('title', `%${val.trim()}%`)
      .limit(5)
    suggestions.value = (data ?? []) as Suggestion[]
    showSuggestions.value = suggestions.value.length > 0
  }, 300)
})

function selectSuggestion(s: Suggestion) {
  if (!s.category) return
  router.push(`/${s.category.slug}/${s.slug}`)
  closeSuggestions()
  searchOpen.value = false
  menuOpen.value = false
}

function closeSuggestions() {
  suggestions.value = []
  showSuggestions.value = false
  searchQuery.value = ''
}

function onInputBlur() {
  setTimeout(() => { showSuggestions.value = false }, 150)
}

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    await nextTick()
    searchInputRef.value?.focus()
  } else {
    closeSuggestions()
  }
}

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searchOpen.value = false
  menuOpen.value = false
  closeSuggestions()
  router.push({ path: '/busca', query: { q } })
}
</script>

<template>
  <header class="site-nav">
    <div class="nav-inner">
      <ul class="nav-links">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="nav-link"
            active-class="nav-link--active"
            exact-active-class="nav-link--active"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>

      <div class="search-wrapper" :class="{ 'search-wrapper--open': searchOpen }">
        <form class="search-form" @submit.prevent="submitSearch">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            class="search-input"
            placeholder="Buscar artigos..."
            :tabindex="searchOpen ? 0 : -1"
            @keydown.escape="searchOpen = false"
            @blur="onInputBlur"
          />
        </form>
        <div v-if="showSuggestions && searchOpen" class="suggestions">
          <button
            v-for="s in suggestions"
            :key="s.id"
            class="suggestion-item"
            @mousedown.prevent="selectSuggestion(s)"
          >
            <span class="suggestion-title">{{ s.title }}</span>
            <span v-if="s.category" class="suggestion-cat">{{ s.category.name }}</span>
          </button>
        </div>
        <button class="search-toggle" aria-label="Buscar" @click="toggleSearch">
          <Icon :name="searchOpen ? 'heroicons:x-mark' : 'heroicons:magnifying-glass'" class="theme-icon" />
        </button>
      </div>

      <button
        class="theme-toggle"
        :aria-label="theme === 'discovery' ? 'Ativar modo escuro' : 'Ativar modo claro'"
        @click="toggle"
      >
        <ClientOnly>
          <Icon :name="theme === 'discovery' ? 'heroicons:moon' : 'heroicons:sun'" class="theme-icon" />
          <template #fallback>
            <Icon name="heroicons:moon" class="theme-icon" />
          </template>
        </ClientOnly>
      </button>

      <button
        class="menu-toggle"
        :aria-expanded="menuOpen"
        aria-label="Menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="menu-bar" />
        <span class="menu-bar" />
        <span class="menu-bar" />
      </button>
    </div>

    <div class="mobile-menu" :class="{ 'mobile-menu--open': menuOpen }">
      <ul class="mobile-links">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="mobile-link"
            active-class="mobile-link--active"
            exact-active-class="mobile-link--active"
            @click="menuOpen = false"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
      <div class="mobile-search-wrap">
        <form class="mobile-search-form" @submit.prevent="submitSearch">
          <input
            v-model="searchQuery"
            class="mobile-search-input"
            placeholder="Buscar artigos..."
            @blur="onInputBlur"
          />
          <button type="submit" class="mobile-search-btn" aria-label="Buscar">
            <Icon name="heroicons:magnifying-glass" class="theme-icon" />
          </button>
        </form>
        <div v-if="showSuggestions && menuOpen" class="mobile-suggestions">
          <button
            v-for="s in suggestions"
            :key="s.id"
            class="suggestion-item"
            @mousedown.prevent="selectSuggestion(s)"
          >
            <span class="suggestion-title">{{ s.title }}</span>
            <span v-if="s.category" class="suggestion-cat">{{ s.category.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(27, 67, 50, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(245, 241, 230, 0.1);
}

.nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-width: 0;
  justify-content: flex-end;
}

.nav-link {
  display: block;
  padding: 8px 16px;
  color: rgba(245, 241, 230, 0.8);
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}
.nav-link:hover {
  color: #f5f1e6;
  background: rgba(245, 241, 230, 0.08);
}
.nav-link--active {
  color: #d4845c;
  background: rgba(212, 132, 92, 0.12);
}

.search-wrapper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}

.search-form {
  width: 0;
  overflow: hidden;
  transition: width 0.25s ease;
}

.search-wrapper--open .search-form {
  width: 220px;
}

.search-input {
  display: block;
  width: 220px;
  background: rgba(245, 241, 230, 0.1);
  border: 1px solid rgba(245, 241, 230, 0.2);
  border-radius: 6px;
  color: #f5f1e6;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  height: 36px;
  padding: 0 12px;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.search-input::placeholder {
  color: rgba(245, 241, 230, 0.45);
}
.search-input:focus {
  background: rgba(245, 241, 230, 0.14);
  border-color: rgba(212, 132, 92, 0.6);
}

.suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 220px;
  background: rgba(12, 38, 22, 0.98);
  border: 1px solid rgba(245, 241, 230, 0.12);
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.suggestion-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  border-top: 1px solid rgba(245, 241, 230, 0.07);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}
.suggestion-item:first-child {
  border-top: none;
}
.suggestion-item:hover {
  background: rgba(245, 241, 230, 0.08);
}

.suggestion-title {
  display: block;
  color: #f5f1e6;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-cat {
  display: block;
  color: #d4845c;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.search-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: rgba(245, 241, 230, 0.75);
  transition: all 0.2s ease;
}
.search-toggle:hover {
  background: rgba(245, 241, 230, 0.08);
  color: #f5f1e6;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: rgba(245, 241, 230, 0.75);
  transition: all 0.2s ease;
}
.theme-toggle:hover {
  background: rgba(245, 241, 230, 0.08);
  color: #f5f1e6;
}

.theme-icon {
  width: 20px;
  height: 20px;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}
.menu-bar {
  display: block;
  width: 22px;
  height: 2px;
  background: #f5f1e6;
  border-radius: 2px;
  transition: background 0.2s ease;
}
.menu-toggle:hover .menu-bar {
  background: #d4845c;
}

.mobile-menu {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease;
  border-top: 1px solid transparent;
}
.mobile-menu--open {
  max-height: 900px;
  border-top-color: rgba(245, 241, 230, 0.08);
}

.mobile-links {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}

.mobile-link {
  display: block;
  padding: 12px 24px;
  color: rgba(245, 241, 230, 0.8);
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.mobile-link:hover {
  color: #f5f1e6;
  background: rgba(245, 241, 230, 0.06);
}
.mobile-link--active {
  color: #d4845c;
}

.mobile-search-wrap {
  border-top: 1px solid rgba(245, 241, 230, 0.08);
  margin-top: 4px;
}

.mobile-search-form {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 12px;
}

.mobile-suggestions {
  border-top: 1px solid rgba(245, 241, 230, 0.08);
  padding: 4px 0 8px;
}

.mobile-suggestions .suggestion-item {
  padding: 10px 16px;
}

.mobile-search-input {
  flex: 1;
  background: rgba(245, 241, 230, 0.1);
  border: 1px solid rgba(245, 241, 230, 0.2);
  border-radius: 6px;
  color: #f5f1e6;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  height: 38px;
  padding: 0 12px;
  outline: none;
}
.mobile-search-input::placeholder {
  color: rgba(245, 241, 230, 0.45);
}
.mobile-search-input:focus {
  border-color: rgba(212, 132, 92, 0.6);
}

.mobile-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 132, 92, 0.2);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 8px;
  color: #d4845c;
  transition: background 0.2s ease;
}
.mobile-search-btn:hover {
  background: rgba(212, 132, 92, 0.35);
}

@media (max-width: 640px) {
  .nav-inner {
    padding: 0 16px;
  }

  .nav-links {
    display: none;
  }

  .search-wrapper {
    display: none;
  }

  .theme-toggle {
    margin-left: auto;
  }

  .menu-toggle {
    display: flex;
  }
}
</style>
