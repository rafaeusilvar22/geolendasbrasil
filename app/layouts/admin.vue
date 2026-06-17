<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const drawerCheckbox = ref<HTMLInputElement>()

useRouter().afterEach(() => {
  if (drawerCheckbox.value) drawerCheckbox.value.checked = false
})

async function handleLogout() {
  await client.auth.signOut()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="drawer" data-theme="discovery">
    <input id="admin-drawer" ref="drawerCheckbox" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content admin-layout">
      <header class="admin-header">
        <div class="admin-header-left">
          <label for="admin-drawer" class="btn btn-ghost btn-square drawer-btn">
            <Icon name="heroicons:bars-3" class="hamburger-icon" />
          </label>
          <span class="admin-title">GeoLendas Brasil</span>
        </div>

        <div class="admin-user">
          <span class="admin-email">{{ user?.email }}</span>
          <button class="logout-btn" @click="handleLogout">Sair</button>
        </div>
      </header>

      <main class="admin-main">
        <slot />
      </main>
    </div>

    <div class="drawer-side">
      <label for="admin-drawer" aria-label="Fechar menu" class="drawer-overlay" />
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <span class="sidebar-brand-text">GeoLendas Brasil</span>
        </div>

        <nav class="sidebar-nav">
          <NuxtLink to="/admin" class="sidebar-link" exact-active-class="sidebar-link--active">
            <Icon name="heroicons:home" class="sidebar-icon" />
            Dashboard
          </NuxtLink>
          <NuxtLink to="/admin/articles" class="sidebar-link" active-class="sidebar-link--active">
            <Icon name="heroicons:document-text" class="sidebar-icon" />
            Artigos
          </NuxtLink>
          <NuxtLink to="/admin/categories" class="sidebar-link" active-class="sidebar-link--active">
            <Icon name="heroicons:tag" class="sidebar-icon" />
            Categorias
          </NuxtLink>
        </nav>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f0ebe0;
  font-family: 'Inter', sans-serif;
}

/* HEADER */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 0 8px;
  height: 64px;
  background: #1b4332;
  border-bottom: 1px solid rgba(245, 241, 230, 0.1);
  position: sticky;
  top: 0;
  z-index: 40;
}

.admin-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-btn {
  color: #f5f1e6;
}
.drawer-btn:hover {
  background: rgba(245, 241, 230, 0.1);
}

.hamburger-icon {
  width: 22px;
  height: 22px;
}

.admin-title {
  font-family: 'Merriweather', serif;
  font-size: 17px;
  font-weight: 700;
  color: #f5f1e6;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-email {
  font-size: 13px;
  color: rgba(245, 241, 230, 0.65);
}

.logout-btn {
  padding: 7px 16px;
  background: transparent;
  border: 1px solid rgba(245, 241, 230, 0.3);
  border-radius: 6px;
  color: #f5f1e6;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}
.logout-btn:hover {
  background: rgba(245, 241, 230, 0.1);
  border-color: rgba(245, 241, 230, 0.5);
}

/* MAIN */
.admin-main {
  padding: 40px;
}

/* SIDEBAR */
.admin-sidebar {
  width: 260px;
  min-height: 100vh;
  background: #1b4332;
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid rgba(245, 241, 230, 0.1);
}

.sidebar-brand-text {
  font-family: 'Merriweather', serif;
  font-size: 16px;
  font-weight: 700;
  color: #f5f1e6;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  gap: 4px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(245, 241, 230, 0.75);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
}
.sidebar-link:hover {
  background: rgba(245, 241, 230, 0.08);
  color: #f5f1e6;
}
.sidebar-link--active {
  background: rgba(212, 132, 92, 0.2);
  color: #d4845c;
}

.sidebar-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .admin-header {
    padding: 0 16px 0 8px;
  }

  .admin-email {
    display: none;
  }

  .admin-main {
    padding: 24px 20px;
  }
}
</style>
