<script setup lang="ts">
import Brazil from '@svg-maps/brazil'

const props = defineProps<{
  statesWithArticles: string[]
  selectedState: string | null
  articleCountByState: Record<string, number>
}>()

const emit = defineEmits<{
  select: [stateName: string | null]
}>()

const ID_TO_NAME: Record<string, string> = {
  ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas',
  ba: 'Bahia', ce: 'Ceará', df: 'Distrito Federal', es: 'Espírito Santo',
  go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso', ms: 'Mato Grosso do Sul',
  mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná',
  pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte',
  rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina',
  sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins',
}

function getName(id: string) {
  return ID_TO_NAME[id] ?? id
}

function hasArticles(id: string) {
  return props.statesWithArticles.includes(getName(id))
}

function getStateClass(id: string) {
  if (props.selectedState === getName(id)) return 'state--selected'
  if (hasArticles(id)) return 'state--has-articles'
  return 'state--empty'
}

function handleClick(id: string) {
  if (!hasArticles(id)) return
  const name = getName(id)
  emit('select', props.selectedState === name ? null : name)
}

function getTitle(id: string) {
  const name = getName(id)
  const count = props.articleCountByState[name] ?? 0
  if (count === 0) return name
  return `${name} — ${count} artigo${count !== 1 ? 's' : ''}`
}

const tooltip = reactive({ visible: false, text: '', x: 0, y: 0 })

function onEnter(id: string, event: MouseEvent) {
  tooltip.text = getTitle(id)
  tooltip.x = event.clientX + 14
  tooltip.y = event.clientY - 40
  tooltip.visible = true
}

function onLeave() {
  tooltip.visible = false
}

function onMouseMove(event: MouseEvent) {
  if (tooltip.visible) {
    tooltip.x = event.clientX + 14
    tooltip.y = event.clientY - 40
  }
}
</script>

<template>
  <div class="map-wrapper" @mousemove="onMouseMove">
    <svg :viewBox="Brazil.viewBox" class="brazil-map" role="img" :aria-label="Brazil.label">
      <path
        v-for="loc in Brazil.locations"
        :key="loc.id"
        :d="loc.path"
        :class="['map-state', getStateClass(loc.id)]"
        @click="handleClick(loc.id)"
        @mouseenter="onEnter(loc.id, $event)"
        @mouseleave="onLeave"
      >
        <title>{{ getTitle(loc.id) }}</title>
      </path>
    </svg>

    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="map-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        {{ tooltip.text }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  user-select: none;
}

.brazil-map {
  width: 100%;
  height: auto;
  display: block;
}

.map-state {
  stroke: var(--pg-bg);
  stroke-width: 0.5;
  transition: fill 0.15s ease;
}

.state--empty {
  fill: var(--pg-map-empty);
  cursor: default;
}

.state--has-articles {
  fill: var(--pg-map-active);
  cursor: pointer;
}

.state--has-articles:hover {
  fill: var(--pg-accent);
}

.state--selected {
  fill: var(--pg-filter-active-bg);
  stroke: var(--pg-accent);
  stroke-width: 1.5;
  cursor: pointer;
}
</style>

<style>
.map-tooltip {
  position: fixed;
  pointer-events: none;
  background: var(--pg-hero-bg);
  color: var(--pg-hero-text);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  z-index: 200;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
</style>
