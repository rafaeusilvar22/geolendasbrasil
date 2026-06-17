<script setup lang="ts">
import type { Article, Category } from '~/types/article'

definePageMeta({ layout: 'admin' })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()

const { data: articles, refresh } = await useAsyncData<(Article & { category: Category | null })[]>(
  'admin-articles',
  async () => {
    const { data } = await client
      .from('articles')
      .select('*, category:categories(id,name)')
      .order('created_at', { ascending: false })
    return data ?? []
  },
)

async function togglePublished(article: Article) {
  await client.from('articles').update({ published: !article.published }).eq('id', article.id)
  await refresh()
}

async function deleteArticle(article: Article) {
  if (!confirm(`Excluir o artigo "${article.title}"?`)) return
  await client.from('articles').delete().eq('id', article.id)
  await refresh()
}

function formattedDate(str: string) {
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Artigos</h1>
      <NuxtLink to="/admin/articles/new" class="btn-new">+ Novo artigo</NuxtLink>
    </div>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Categoria</th>
            <th>Estado</th>
            <th>Status</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in articles" :key="article.id" class="table-row">
            <td class="td-title">{{ article.title }}</td>
            <td class="td-cat">{{ article.category?.name ?? '—' }}</td>
            <td class="td-state">{{ article.state || '—' }}</td>
            <td class="td-status">
              <button
                class="status-badge"
                :class="article.published ? 'status-badge--published' : 'status-badge--draft'"
                @click="togglePublished(article)"
              >
                {{ article.published ? 'Publicado' : 'Rascunho' }}
              </button>
            </td>
            <td class="td-date">{{ formattedDate(article.created_at) }}</td>
            <td class="td-actions">
              <NuxtLink :to="`/admin/articles/${article.id}`" class="action-edit">Editar</NuxtLink>
              <button class="action-delete" @click="deleteArticle(article)">Excluir</button>
            </td>
          </tr>
          <tr v-if="!articles?.length">
            <td colspan="6" class="td-empty">Nenhum artigo cadastrado.</td>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Merriweather', serif;
  font-size: 24px;
  font-weight: 700;
  color: #1b4332;
  margin: 0;
}

.btn-new {
  padding: 10px 20px;
  background: #2d6a4f;
  color: #f5f1e6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  text-decoration: none;
  transition: background 0.2s ease;
}
.btn-new:hover {
  background: #1b4332;
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
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #8b6f47;
}

.table-row {
  border-top: 1px solid #f0ebe0;
  transition: background 0.15s ease;
}
.table-row:hover {
  background: #faf8f4;
}

.table td {
  padding: 14px 16px;
  color: #1a1a1a;
  vertical-align: middle;
}

.td-title {
  font-weight: 600;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.td-cat {
  color: #8b6f47;
}

.td-state {
  color: #666;
  font-size: 13px;
}

.td-date {
  color: #999;
  font-size: 13px;
  white-space: nowrap;
}

.td-empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: opacity 0.15s ease;
}
.status-badge:hover {
  opacity: 0.8;
}
.status-badge--published {
  background: rgba(45, 106, 79, 0.12);
  color: #2d6a4f;
}
.status-badge--draft {
  background: rgba(139, 111, 71, 0.12);
  color: #8b6f47;
}

.td-actions {
  display: flex;
  gap: 12px;
}

.action-edit {
  color: #2d6a4f;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  font-family: 'Inter', sans-serif;
}
.action-edit:hover {
  text-decoration: underline;
}

.action-delete {
  background: none;
  border: none;
  color: #c9724a;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  padding: 0;
}
.action-delete:hover {
  text-decoration: underline;
}
</style>
