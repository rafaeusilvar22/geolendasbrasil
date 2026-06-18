<script setup lang="ts">
const { data: categories } = await useCategories()

const links = computed(() => [
  { label: 'Início', to: '/' },
  ...(categories.value ?? []).filter((c) => c.show_in_nav).map((c) => ({ label: c.name, to: `/${c.slug}` })),
])

const menuOpen = ref(false)
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
  justify-content: flex-end;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
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
  max-height: 400px;
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

@media (max-width: 640px) {
  .nav-inner {
    padding: 0 20px;
  }

  .nav-links {
    display: none;
  }

  .menu-toggle {
    display: flex;
  }
}
</style>
