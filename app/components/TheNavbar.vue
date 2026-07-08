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
const route = useRoute()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()

const staticLinks = [
  { label: 'Início', to: '/' },
  { label: 'Mapa', to: '/mapa' },
  { label: 'Quiz', to: '/quiz' },
]

const categoryTree = computed(() =>
  buildCategoryTree(categories.value ?? [])
    .filter((node) => node.show_in_nav)
    .map((node) => ({ ...node, children: node.children.filter((c) => c.show_in_nav) })),
)

const categoryLinks = computed(() =>
  categoryTree.value.flatMap((node) =>
    node.children.length
      ? node.children.map((c) => ({ label: c.name, to: `/${c.slug}` }))
      : [{ label: node.name, to: `/${node.slug}` }],
  ),
)

const categoriesMenuOpen = ref(false)
const isCategoryActive = computed(() => categoryLinks.value.some((l) => route.path.startsWith(l.to)))

function toggleCategoriesMenu() {
  categoriesMenuOpen.value = !categoriesMenuOpen.value
}

function onCategoriesBlur() {
  setTimeout(() => { categoriesMenuOpen.value = false }, 150)
}

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
        <li v-for="link in staticLinks" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="nav-link"
            active-class="nav-link--active"
            exact-active-class="nav-link--active"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
        <li v-if="categoryLinks.length" class="nav-dropdown" :class="{ 'nav-dropdown--open': categoriesMenuOpen }">
          <button
            type="button"
            class="nav-link nav-dropdown-trigger"
            :class="{ 'nav-link--active': isCategoryActive }"
            :aria-expanded="categoriesMenuOpen"
            @click="toggleCategoriesMenu"
            @blur="onCategoriesBlur"
            @keydown.escape="categoriesMenuOpen = false"
          >
            Categorias
            <Icon name="heroicons:chevron-down" class="dropdown-chevron" />
          </button>
          <div v-if="categoriesMenuOpen" class="dropdown-panel">
            <template v-for="node in categoryTree" :key="node.id">
              <template v-if="node.children.length">
                <span class="dropdown-group-label">{{ node.name }}</span>
                <NuxtLink
                  v-for="child in node.children"
                  :key="child.id"
                  :to="`/${child.slug}`"
                  class="dropdown-item dropdown-item--child"
                  active-class="dropdown-item--active"
                  @click="categoriesMenuOpen = false"
                >
                  {{ child.name }}
                </NuxtLink>
              </template>
              <NuxtLink
                v-else
                :to="`/${node.slug}`"
                class="dropdown-item"
                active-class="dropdown-item--active"
                @click="categoriesMenuOpen = false"
              >
                {{ node.name }}
              </NuxtLink>
            </template>
          </div>
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
        <label class="swap swap-rotate search-toggle" aria-label="Buscar">
          <input type="checkbox" :checked="searchOpen" @change="toggleSearch" />
          <Icon name="heroicons:x-mark" class="swap-on theme-icon" />
          <Icon name="heroicons:magnifying-glass" class="swap-off theme-icon" />
        </label>
      </div>

      <ClientOnly>
        <label
          class="swap swap-rotate theme-toggle"
          :aria-label="theme === 'pergaminho' ? 'Ativar modo escuro' : 'Ativar modo claro'"
        >
          <input type="checkbox" :checked="theme === 'penumbra'" @change="toggle" />
          <Icon name="heroicons:sun" class="swap-on theme-icon" />
          <Icon name="heroicons:moon" class="swap-off theme-icon" />
        </label>
        <template #fallback>
          <span class="theme-toggle" aria-hidden="true">
            <Icon name="heroicons:moon" class="theme-icon" />
          </span>
        </template>
      </ClientOnly>

      <label class="swap swap-rotate menu-toggle" :aria-expanded="menuOpen">
        <input type="checkbox" aria-label="Menu" :checked="menuOpen" @change="menuOpen = !menuOpen" />
        <span class="swap-off menu-icon">
          <span class="menu-bar" />
          <span class="menu-bar" />
          <span class="menu-bar" />
        </span>
        <Icon name="heroicons:x-mark" class="swap-on menu-close-icon" />
      </label>
    </div>

    <div class="mobile-menu" :class="{ 'mobile-menu--open': menuOpen }">
      <ul class="mobile-links">
        <li v-for="link in staticLinks" :key="link.to">
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
        <template v-for="node in categoryTree" :key="node.id">
          <template v-if="node.children.length">
            <li class="mobile-group-label">{{ node.name }}</li>
            <li v-for="child in node.children" :key="child.id">
              <NuxtLink
                :to="`/${child.slug}`"
                class="mobile-link mobile-link--child"
                active-class="mobile-link--active"
                exact-active-class="mobile-link--active"
                @click="menuOpen = false"
              >
                {{ child.name }}
              </NuxtLink>
            </li>
          </template>
          <li v-else>
            <NuxtLink
              :to="`/${node.slug}`"
              class="mobile-link"
              active-class="mobile-link--active"
              exact-active-class="mobile-link--active"
              @click="menuOpen = false"
            >
              {{ node.name }}
            </NuxtLink>
          </li>
        </template>
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
  background: rgba(21, 18, 37, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(216, 210, 230, 0.1);
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
  color: rgba(216, 210, 230, 0.8);
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}
.nav-link:hover {
  color: #D8D2E6;
  background: rgba(216, 210, 230, 0.08);
}
.nav-link--active {
  color: #C9A24B;
  background: rgba(201, 162, 75, 0.12);
}

.nav-dropdown {
  position: relative;
}

.nav-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
}

.dropdown-chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}
.nav-dropdown--open .dropdown-chevron {
  transform: rotate(180deg);
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  max-height: 60vh;
  overflow-y: auto;
  background: rgba(14, 12, 24, 0.98);
  border: 1px solid rgba(216, 210, 230, 0.12);
  border-radius: 8px;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: block;
  padding: 10px 16px;
  color: rgba(216, 210, 230, 0.8);
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border-top: 1px solid rgba(216, 210, 230, 0.07);
  transition: background 0.15s ease, color 0.15s ease;
}
.dropdown-item:first-child {
  border-top: none;
}
.dropdown-item:hover {
  color: #D8D2E6;
  background: rgba(216, 210, 230, 0.08);
}
.dropdown-item--active {
  color: #C9A24B;
  background: rgba(201, 162, 75, 0.12);
}

.dropdown-item--child {
  padding-left: 28px;
}

.dropdown-group-label {
  display: block;
  padding: 10px 16px 4px;
  color: rgba(216, 210, 230, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  border-top: 1px solid rgba(216, 210, 230, 0.07);
}
.dropdown-group-label:first-child {
  border-top: none;
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
  background: rgba(216, 210, 230, 0.1);
  border: 1px solid rgba(216, 210, 230, 0.2);
  border-radius: 6px;
  color: #D8D2E6;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  height: 36px;
  padding: 0 12px;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.search-input::placeholder {
  color: rgba(216, 210, 230, 0.45);
}
.search-input:focus {
  background: rgba(216, 210, 230, 0.14);
  border-color: rgba(201, 162, 75, 0.6);
}

.suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 220px;
  background: rgba(14, 12, 24, 0.98);
  border: 1px solid rgba(216, 210, 230, 0.12);
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
  border-top: 1px solid rgba(216, 210, 230, 0.07);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}
.suggestion-item:first-child {
  border-top: none;
}
.suggestion-item:hover {
  background: rgba(216, 210, 230, 0.08);
}

.suggestion-title {
  display: block;
  color: #D8D2E6;
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
  color: #C9A24B;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.search-toggle {
  padding: 8px;
  border-radius: 6px;
  color: rgba(216, 210, 230, 0.75);
  transition: background 0.2s ease, color 0.2s ease;
}
.search-toggle:hover {
  background: rgba(216, 210, 230, 0.08);
  color: #D8D2E6;
}

.theme-toggle {
  padding: 8px;
  border-radius: 6px;
  color: rgba(216, 210, 230, 0.75);
  transition: background 0.2s ease, color 0.2s ease;
}
.theme-toggle:hover {
  background: rgba(216, 210, 230, 0.08);
  color: #D8D2E6;
}

.theme-icon {
  width: 20px;
  height: 20px;
}

.menu-toggle {
  display: none;
  padding: 8px;
}
.menu-icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}
.menu-bar {
  display: block;
  width: 22px;
  height: 2px;
  background: #D8D2E6;
  border-radius: 2px;
  transition: background 0.2s ease;
}
.menu-toggle:hover .menu-bar {
  background: #C9A24B;
}
.menu-close-icon {
  width: 20px;
  height: 20px;
  color: #D8D2E6;
}

.mobile-menu {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease;
  border-top: 1px solid transparent;
}
.mobile-menu--open {
  max-height: 900px;
  border-top-color: rgba(216, 210, 230, 0.08);
}

.mobile-links {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}

.mobile-link {
  display: block;
  padding: 12px 24px;
  color: rgba(216, 210, 230, 0.8);
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.mobile-link:hover {
  color: #D8D2E6;
  background: rgba(216, 210, 230, 0.06);
}
.mobile-link--active {
  color: #C9A24B;
}

.mobile-link--child {
  padding-left: 40px;
}

.mobile-group-label {
  padding: 12px 24px 4px;
  color: rgba(216, 210, 230, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
}

.mobile-search-wrap {
  border-top: 1px solid rgba(216, 210, 230, 0.08);
  margin-top: 4px;
}

.mobile-search-form {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 12px;
}

.mobile-suggestions {
  border-top: 1px solid rgba(216, 210, 230, 0.08);
  padding: 4px 0 8px;
}

.mobile-suggestions .suggestion-item {
  padding: 10px 16px;
}

.mobile-search-input {
  flex: 1;
  background: rgba(216, 210, 230, 0.1);
  border: 1px solid rgba(216, 210, 230, 0.2);
  border-radius: 6px;
  color: #D8D2E6;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  height: 38px;
  padding: 0 12px;
  outline: none;
}
.mobile-search-input::placeholder {
  color: rgba(216, 210, 230, 0.45);
}
.mobile-search-input:focus {
  border-color: rgba(201, 162, 75, 0.6);
}

.mobile-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 162, 75, 0.2);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 8px;
  color: #C9A24B;
  transition: background 0.2s ease;
}
.mobile-search-btn:hover {
  background: rgba(201, 162, 75, 0.35);
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
    display: inline-grid;
  }
}
</style>
