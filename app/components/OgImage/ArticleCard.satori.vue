<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: '#151225',
      padding: '64px',
      fontFamily: 'Inter, sans-serif',
    }"
  >
    <!-- Site name - topo -->
    <div :style="{ display: 'flex', marginBottom: 'auto' }">
      <span
        :style="{
          fontSize: '16px',
          fontWeight: '600',
          color: 'rgba(216,210,230,0.55)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }"
      >
        {{ SITE_NAME }}
      </span>
    </div>

    <!-- Conteúdo principal - parte inferior -->
    <div :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Badges -->
      <div v-if="state || category" :style="{ display: 'flex', gap: '8px', marginBottom: '20px' }">
        <span
          v-if="state"
          :style="{
            backgroundColor: 'rgba(216,210,230,0.1)',
            border: '1px solid rgba(216,210,230,0.2)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#D8D2E6',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }"
        >
          {{ state }}
        </span>
        <span
          v-if="category"
          :style="{
            backgroundColor: 'rgba(201,162,75,0.2)',
            border: '1px solid rgba(201,162,75,0.4)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#E3C077',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }"
        >
          {{ category }}
        </span>
      </div>

      <!-- Título -->
      <div
        :style="{
          fontSize: '52px',
          fontWeight: '700',
          color: '#D8D2E6',
          lineHeight: '1.2',
          marginBottom: '20px',
        }"
      >
        {{ title }}
      </div>

      <!-- Resumo -->
      <div
        :style="{
          fontSize: '20px',
          color: 'rgba(216,210,230,0.68)',
          lineHeight: '1.5',
          marginBottom: '36px',
        }"
      >
        {{ description }}
      </div>

      <!-- Linha de acento terra -->
      <div
        :style="{
          width: '56px',
          height: '4px',
          backgroundColor: '#C9A24B',
          borderRadius: '2px',
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  state?: string
  category?: string
}>()
</script>
