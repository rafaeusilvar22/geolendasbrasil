<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: '#1b4332',
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
          color: 'rgba(245,241,230,0.55)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }"
      >
        Descobertas Brasil
      </span>
    </div>

    <!-- Conteúdo principal - parte inferior -->
    <div :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Badges -->
      <div v-if="state || category" :style="{ display: 'flex', gap: '8px', marginBottom: '20px' }">
        <span
          v-if="state"
          :style="{
            backgroundColor: 'rgba(245,241,230,0.1)',
            border: '1px solid rgba(245,241,230,0.2)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#f5f1e6',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }"
        >
          {{ state }}
        </span>
        <span
          v-if="category"
          :style="{
            backgroundColor: 'rgba(212,132,92,0.2)',
            border: '1px solid rgba(212,132,92,0.4)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#e8a87c',
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
          color: '#f5f1e6',
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
          color: 'rgba(245,241,230,0.68)',
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
          backgroundColor: '#d4845c',
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
