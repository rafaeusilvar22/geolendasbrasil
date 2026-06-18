<script setup lang="ts">
const { theme } = useTheme()
useHead({
  htmlAttrs: { 'data-theme': theme },
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
