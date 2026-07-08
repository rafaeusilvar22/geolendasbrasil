<script setup lang="ts">
import type { Article } from "~/types/article";

const props = defineProps<{
  articles: Article[];
  expanded: boolean;
}>();

const emit = defineEmits<{
  expand: [];
  collapse: [];
}>();

const PREVIEW_COUNT = 4;

const visibleArticles = computed(() =>
  props.expanded ? props.articles : props.articles.slice(0, PREVIEW_COUNT),
);
</script>

<template>
  <div class="articles-grid">
    <ArticleCard
      v-for="article in visibleArticles"
      :key="article.id"
      :article="article"
    />
  </div>

  <div v-if="articles.length > PREVIEW_COUNT" class="see-more">
    <button
      v-if="!expanded"
      class="see-more-btn"
      @click="emit('expand')"
    >
      Ver mais {{ articles.length - PREVIEW_COUNT }}
      {{ articles.length - PREVIEW_COUNT === 1 ? "artigo" : "artigos" }}
    </button>
    <button
      v-else
      class="see-more-btn see-more-btn--collapse"
      @click="emit('collapse')"
    >
      Ver menos
    </button>
  </div>
</template>

<style scoped>
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.see-more {
  margin-top: 32px;
  text-align: center;
}

.see-more-btn {
  padding: 12px 32px;
  background: transparent;
  border: 1.5px solid var(--pg-filter-border);
  border-radius: 24px;
  color: var(--pg-filter-text);
  font-size: 14px;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}
.see-more-btn:hover {
  background: var(--pg-filter-active-bg);
  border-color: var(--pg-filter-active-bg);
  color: var(--pg-filter-active-text);
}
.see-more-btn--collapse {
  font-weight: 400;
  font-size: 13px;
  opacity: 0.7;
}
.see-more-btn--collapse:hover {
  background: transparent;
  border-color: var(--pg-filter-border);
  color: var(--pg-filter-text);
  opacity: 1;
}

@media (max-width: 640px) {
  .articles-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
