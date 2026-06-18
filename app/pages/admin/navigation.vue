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
                class="toggle"
                :class="cat.show_in_nav ? 'toggle--on' : 'toggle--off'"
                :aria-label="`${cat.show_in_nav ? 'Desativar' : 'Ativar'} ${cat.name} no menu`"
                @click="toggle(cat, 'show_in_nav')"
              >
                <span class="toggle-thumb" />
              </button>
            </td>
            <td class="td-toggle">
              <button
                class="toggle"
                :class="cat.show_in_home ? 'toggle--on' : 'toggle--off'"
                :aria-label="`${cat.show_in_home ? 'Desativar' : 'Ativar'} ${cat.name} na home`"
                @click="toggle(cat, 'show_in_home')"
              >
                <span class="toggle-thumb" />
              </button>
            </td>
          </tr>
          <tr v-if="!categories?.length">
            <td colspan="3" class="td-empty">Nenhuma categoria cadastrada.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 40px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Merriweather', serif;
  font-size: 24px;
  font-weight: 700;
  color: #1b4332;
  margin: 0 0 6px 0;
}

.page-desc {
  font-size: 14px;
  color: #8b6f47;
  margin: 0;
  font-family: 'Inter', sans-serif;
}

.table-wrapper {
  background: #fff;
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
  background: #f5f1e6;
}

.table th {
  padding: 12px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #8b6f47;
}

.th-center {
  text-align: center;
}

.table-row {
  border-top: 1px solid #f0ebe0;
  transition: background 0.15s ease;
}
.table-row:hover {
  background: #faf8f4;
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
  color: #1a1a1a;
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
}

.td-empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

/* Toggle switch */
.toggle {
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  padding: 2px;
  transition: background 0.2s ease;
  position: relative;
}

.toggle--on {
  background: #2d6a4f;
}

.toggle--off {
  background: #d9cfc1;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
  display: block;
}

.toggle--on .toggle-thumb {
  transform: translateX(20px);
}

.toggle--off .toggle-thumb {
  transform: translateX(0);
}
</style>
