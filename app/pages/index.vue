<template>
  <div class="page-root">
    <div class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">{{ SITE_NAME }}</h1>
        <p class="hero-subtitle">
          Histórias, lendas, tradições e geografia que moldaram cada estado do
          Brasil. Explore a magia ancestral das nossas terras.
        </p>
      </div>
    </div>

    <div class="content">
      <div
        v-for="section in allSections"
        :key="section.category.id"
        class="category-group"
      >
        <div class="category-header">
          <h2 class="category-title">{{ section.category.name }}</h2>
          <p class="category-count">
            {{ section.totalCount }}
            {{ section.totalCount === 1 ? "artigo" : "artigos" }}
          </p>
        </div>

        <template v-if="section.nested">
          <div
            v-for="sub in section.groups"
            :key="sub.category.id"
            class="subcategory-group"
          >
            <div class="subcategory-header">
              <h3 class="subcategory-title">{{ sub.category.name }}</h3>
              <p class="category-count">
                {{ sub.articles.length }}
                {{ sub.articles.length === 1 ? "artigo" : "artigos" }}
              </p>
            </div>

            <CategoryArticles
              :articles="sub.articles"
              :expanded="expandedCategories.has(sub.category.id)"
              @expand="expandedCategories.add(sub.category.id)"
              @collapse="expandedCategories.delete(sub.category.id)"
            />
          </div>
        </template>

        <CategoryArticles
          v-else
          :articles="section.mainGroup.articles"
          :expanded="expandedCategories.has(section.mainGroup.category.id)"
          @expand="expandedCategories.add(section.mainGroup.category.id)"
          @collapse="expandedCategories.delete(section.mainGroup.category.id)"
        />
      </div>

      <div v-if="allSections.length === 0" class="empty-state">
        <p class="empty-state-text">
          Nenhum artigo encontrado. Tente ajustar seus filtros.
        </p>
      </div>
    </div>

    <footer class="footer">
      <p class="footer-text">
        {{ SITE_NAME }} © {{ new Date().getFullYear() }} | Preservando
        histórias, celebrando culturas
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { Article, Category, CategoryGroup } from "~/types/article";

interface HomeSection {
  category: Category;
  groups: CategoryGroup[];
  mainGroup: CategoryGroup;
  nested: boolean;
  totalCount: number;
}

const client = useSupabaseClient();

const { data: articles } = await useAsyncData<Article[]>(
  "homepage-articles",
  async () => {
    const { data } = await client
      .from("articles")
      .select(
        "id, title, excerpt, content, state, category_id, type, slug, published, has_audio, created_at, updated_at, category:categories!inner(*)",
      )
      .eq("published", true)
      .eq("category.show_in_home", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    return data ?? [];
  },
);

const { data: categories } = await useCategories();

const expandedCategories = reactive(new Set<number>());

const allSections = computed<HomeSection[]>(() => {
  const byId = new Map((categories.value ?? []).map((c) => [c.id, c]));

  const leafGroups = new Map<number, CategoryGroup>();
  (articles.value ?? []).forEach((a) => {
    if (!a.category_id || !a.category) return;
    const group = leafGroups.get(a.category_id) ?? {
      category: a.category,
      articles: [],
    };
    group.articles.push(a);
    leafGroups.set(a.category_id, group);
  });

  const sections = new Map<number, HomeSection>();
  for (const group of leafGroups.values()) {
    const parent = group.category.parent_id
      ? byId.get(group.category.parent_id)
      : undefined;
    const topCategory = parent ?? group.category;
    const section = sections.get(topCategory.id) ?? {
      category: topCategory,
      groups: [],
      mainGroup: group,
      nested: false,
      totalCount: 0,
    };
    section.groups.push(group);
    section.nested = section.nested || group.category.id !== topCategory.id;
    section.totalCount += group.articles.length;
    sections.set(topCategory.id, section);
  }

  return Array.from(sections.values())
    .map((section) => ({
      ...section,
      groups: section.groups.sort(
        (a, b) =>
          a.category.sort_order - b.category.sort_order ||
          a.category.id - b.category.id,
      ),
    }))
    .sort(
      (a, b) =>
        a.category.sort_order - b.category.sort_order ||
        a.category.id - b.category.id,
    );
});

useSeoMeta({
  title: SITE_NAME,
  description:
    "Histórias, lendas, tradições e geografia que moldaram cada estado do Brasil. Explore a magia ancestral das nossas terras.",
  ogTitle: SITE_NAME,
  ogDescription:
    "Histórias, lendas, tradições e geografia que moldaram cada estado do Brasil.",
  ogUrl: `${SITE_URL}/`,
  ogType: "website",
  ogImage: `${SITE_URL}/icon-512x512.png`,
  twitterCard: "summary",
});
useHead({ link: [{ rel: "canonical", href: `${SITE_URL}/` }] });
</script>

<style scoped>
.page-root {
  min-height: 100vh;
  background: var(--pg-bg);
  font-family: "Inter", sans-serif;
  color: var(--pg-text);
  transition:
    background 0.3s ease,
    color 0.3s ease;
}

.hero {
  padding: 80px 40px;
  background: var(--pg-hero-bg);
  text-align: center;
  color: var(--pg-hero-text);
}

.hero-inner {
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-family: "Merriweather", serif;
  font-size: 56px;
  font-weight: 700;
  margin: 0 0 24px 0;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 18px;
  font-weight: 400;
  margin: 0;
  opacity: 0.85;
  line-height: 1.6;
}

.content {
  padding: 48px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.category-group {
  margin-bottom: 72px;
}

.category-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--pg-section-border);
}

.category-title {
  font-family: "Merriweather", serif;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: var(--pg-heading);
  text-transform: capitalize;
}

.category-count {
  font-size: 13px;
  color: var(--pg-text-muted);
  margin: 6px 0 0 0;
}

.subcategory-group {
  margin-top: 40px;
  padding-left: 24px;
  border-left: 2px solid var(--pg-section-border);
}
.subcategory-group:first-of-type {
  margin-top: 0;
}

.subcategory-header {
  margin-bottom: 20px;
}

.subcategory-title {
  font-family: "Merriweather", serif;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--pg-heading);
  text-transform: capitalize;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
}

.empty-state-text {
  font-size: 18px;
  margin: 0;
  color: var(--pg-text-muted);
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
  .hero {
    padding: 48px 16px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .content {
    padding: 32px 16px;
  }

  .subcategory-group {
    padding-left: 16px;
  }

  .empty-state {
    padding: 48px 16px;
  }

  .footer {
    padding: 40px 16px 32px;
  }
}
</style>
