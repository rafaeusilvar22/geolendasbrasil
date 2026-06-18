<script setup lang="ts">
const { data: categories } = await useCategories()
const { theme, toggle } = useTheme()
const router = useRouter()

const links = computed(() => [
  { label: 'Início', to: '/' },
  ...(categories.value ?? []).filter((c) => c.show_in_nav).map((c) => ({ label: c.name, to: `/${c.slug}` })),
])

const menuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    await nextTick()
    searchInputRef.value?.focus()
  }
}

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searchOpen.value = false
  searchQuery.value = ''
  menuOpen.value = false
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
          />
        </form>
        <button class="search-toggle" aria-label="Buscar" @click="toggleSearch">
          <Icon :name="searchOpen ? 'heroicons:x-mark' : 'heroicons:magnifying-glass'" class="theme-icon" />
        </button>
      </div>

      <button
        class="theme-toggle"
        :aria-label="theme === 'discovery' ? 'Ativar modo escuro' : 'Ativar modo claro'"
        @click="toggle"
      >
        <Icon :name="theme === 'discovery' ? 'heroicons:moon' : 'heroicons:sun'" class="theme-icon" />
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
      <form class="mobile-search-form" @submit.prevent="submitSearch">
        <input
          v-model="searchQuery"
          class="mobile-search-input"
          placeholder="Buscar artigos..."
        />
        <button type="submit" class="mobile-search-btn" aria-label="Buscar">
          <Icon name="heroicons:magnifying-glass" class="theme-icon" />
        </button>
      </form>
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
  max-height: 600px;
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

.mobile-search-form {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 12px;
  border-top: 1px solid rgba(245, 241, 230, 0.08);
  margin-top: 4px;
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
