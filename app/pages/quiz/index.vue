<script setup lang="ts">
useSeoMeta({
  title: `Quiz de Lendas Brasileiras — ${SITE_NAME}`,
  description: 'Teste seus conhecimentos sobre lendas, folclore e geografia do Brasil em um quiz interativo.',
  ogTitle: `Quiz de Lendas Brasileiras — ${SITE_NAME}`,
  ogDescription: 'Teste seus conhecimentos sobre lendas, folclore e geografia do Brasil.',
  ogUrl: `${SITE_URL}/quiz`,
  ogType: 'website',
})
useHead({ link: [{ rel: 'canonical', href: `${SITE_URL}/quiz` }] })
</script>

<template>
  <div class="page-root">
    <QuizSelector />
  </div>
</template>

<style scoped>
.page-root {
  min-height: 100vh;
  background: var(--pg-bg);
  transition: background 0.3s ease, color 0.3s ease;
}
</style>
