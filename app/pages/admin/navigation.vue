<script setup lang="ts">
import type { Category } from '~/types/article'

definePageMeta({ layout: 'admin' })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()

const { data: categories, refresh } = await useAsyncData<Category[]>('admin-nav-categories', async () => {
  const { data } = await client.from('categories').select('*').order('sort_order')
  return data ?? []
})

async function toggle(cat: Category, field: 'show_in_nav' | 'show_in_home') {
  await client.from('categories').update({ [field]: !cat[field] }).eq('id', cat.id)
  await refresh()
}

useHead({ title: 'Navegação — Admin' })
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Navegação e Home</h1>
        <p class="page-desc">Controle quais categorias aparecem no menu e na página inicial.</p>
      </div>
    </div>

    <!-- Desktop: tabela -->
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th class="th-center">Exibir no menu</th>
            <th class="th-center">Exibir na home</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id" class="table-row">
            <td class="td-name">
              <div
                class="gradient-dot"
                :style="{ '--from': `#${cat.gradient[0]}`, '--to': `#${cat.gradient[1]}` }"
              />
              {{ cat.name }}
            </td>
            <td class="td-toggle">
              <button
                class="sw"
                :class="cat.show_in_nav ? 'sw--on' : 'sw--off'"
                :aria-label="`${cat.show_in_nav ? 'Desativar' : 'Ativar'} ${cat.name} no menu`"
                @click="toggle(cat, 'show_in_nav')"
              >
                <span class="sw-thumb" />
              </button>
            </td>
            <td class="td-toggle">
              <button
                class="sw"
                :class="cat.show_in_home ? 'sw--on' : 'sw--off'"
                :aria-label="`${cat.show_in_home ? 'Desativar' : 'Ativar'} ${cat.name} na home`"
                @click="toggle(cat, 'show_in_home')"
              >
                <span class="sw-thumb" />
              </button>
            </td>
          </tr>
          <tr v-if="!categories?.length">
            <td colspan="3" class="td-empty">Nenhuma categoria cadastrada.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile: cards -->
    <div class="card-list">
      <div v-if="!categories?.length" class="card-empty">Nenhuma categoria cadastrada.</div>
      <div v-for="cat in categories" :key="cat.id" class="card">
        <div class="card-top">
          <div
            class="gradient-dot"
            :style="{ '--from': `#${cat.gradient[0]}`, '--to': `#${cat.gradient[1]}` }"
          />
          <span class="card-name">{{ cat.name }}</span>
        </div>
        <div class="card-toggles">
          <div class="card-toggle-row">
            <span class="card-toggle-label">Exibir no menu</span>
            <button
              class="sw"
              :class="cat.show_in_nav ? 'sw--on' : 'sw--off'"
              :aria-label="`${cat.show_in_nav ? 'Desativar' : 'Ativar'} ${cat.name} no menu`"
              @click="toggle(cat, 'show_in_nav')"
            >
              <span class="sw-thumb" />
            </button>
          </div>
          <div class="card-toggle-row">
            <span class="card-toggle-label">Exibir na home</span>
            <button
              class="sw"
              :class="cat.show_in_home ? 'sw--on' : 'sw--off'"
              :aria-label="`${cat.show_in_home ? 'Desativar' : 'Ativar'} ${cat.name} na home`"
              @click="toggle(cat, 'show_in_home')"
            >
              <span class="sw-thumb" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 32px 40px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Merriweather', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--adm-heading);
  margin: 0 0 6px 0;
}

.page-desc {
  font-size: 14px;
  color: var(--adm-text-muted);
  margin: 0;
  font-family: 'Inter', sans-serif;
}

.table-wrapper {
  background: var(--adm-surface);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

.table thead tr {
  background: var(--adm-surface-alt);
}

.table th {
  padding: 12px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--adm-text-muted);
}

.th-center {
  text-align: center;
  width: 160px;
}

.table-row {
  border-top: 1px solid var(--adm-row-divider);
  transition: background 0.15s ease;
}
.table-row:hover {
  background: var(--adm-row-hover);
}

.table td {
  padding: 16px 20px;
  vertical-align: middle;
}

.td-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--adm-text);
}

.gradient-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--from), var(--to));
  flex-shrink: 0;
}

.td-toggle {
  text-align: center;
  width: 160px;
}

.td-empty {
  text-align: center;
  color: var(--adm-text-faint);
  padding: 40px;
}

/* Toggle switch */
.sw {
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  padding: 2px;
  transition: background 0.2s ease;
  overflow: hidden;
  flex-shrink: 0;
}

.sw--on {
  background: var(--adm-accent);
}

.sw--off {
  background: var(--adm-sw-off);
}

.sw-thumb {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
  display: block;
}

.sw--on .sw-thumb {
  transform: translateX(20px);
}

.sw--off .sw-thumb {
  transform: translateX(0);
}

/* CARDS (mobile) */
.card-list {
  display: none;
}

.card-empty {
  text-align: center;
  color: var(--adm-text-faint);
  font-size: 14px;
  padding: 40px 0;
  font-family: 'Inter', sans-serif;
}

.card {
  background: var(--adm-surface);
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-name {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--adm-text);
}

.card-toggles {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
  border-top: 1px solid var(--adm-row-divider);
}

.card-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-toggle-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--adm-text-secondary);
}

@media (max-width: 640px) {
  .page {
    padding: 24px 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .table-wrapper {
    display: none;
  }

  .card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
