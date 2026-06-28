<script setup lang="ts">
const { track, isOpen, playTrigger, close } = useAudioPlayer()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const audioDuration = ref(0)

const audioProgress = computed(() =>
  audioDuration.value > 0 ? (currentTime.value / audioDuration.value) * 100 : 0
)

const timeDisplay = computed(() => {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  return `${fmt(currentTime.value)} / ${fmt(audioDuration.value)}`
})

watch(playTrigger, async () => {
  if (!track.value || !audioRef.value) return
  audioRef.value.src = track.value.url
  audioRef.value.load()
  try {
    await audioRef.value.play()
    isPlaying.value = true
  } catch {}
})

watch(isOpen, (open) => {
  if (!open) {
    audioRef.value?.pause()
    isPlaying.value = false
    currentTime.value = 0
    audioDuration.value = 0
  }
})

function togglePlay() {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    audioRef.value.play()
    isPlaying.value = true
  }
}

function onTimeUpdate() {
  currentTime.value = audioRef.value?.currentTime ?? 0
}

function onLoadedMetadata() {
  audioDuration.value = audioRef.value?.duration ?? 0
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
}

function seekTo(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  if (audioRef.value && audioDuration.value) {
    audioRef.value.currentTime = ratio * audioDuration.value
  }
}
</script>

<template>
  <div :class="['layout-root', { 'layout-root--player-open': isOpen && track }]">
    <TheNavbar />
    <slot />

    <audio
      ref="audioRef"
      style="display:none"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    />

    <Teleport to="body">
      <Transition name="player-slide">
        <div v-if="isOpen && track" class="audio-player-bar">
          <div class="player-seek-track" @click="seekTo">
            <div class="player-seek-fill" :style="{ width: audioProgress + '%' }" />
          </div>

          <div class="player-body">
            <button class="player-btn-play" :title="isPlaying ? 'Pausar' : 'Reproduzir'" @click="togglePlay">
              <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5,3 19,12 5,21"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>

            <div class="player-info">
              <span class="player-title">{{ track.title }}</span>
              <span class="player-sub">
                <span v-if="track.category">{{ track.category }}</span>
                <span v-if="track.category" class="player-dot">·</span>
                <span class="player-time">{{ timeDisplay }}</span>
              </span>
            </div>

            <button class="player-btn-close" title="Fechar player" @click="close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
.audio-player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99998;
  background: rgba(10, 8, 5, 0.97);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid rgba(192, 168, 130, 0.1);
}

.player-seek-track {
  height: 3px;
  background: rgba(192, 168, 130, 0.12);
  cursor: pointer;
  position: relative;
  transition: height 0.15s ease;
}
.player-seek-track:hover { height: 5px; }

.player-seek-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #2D6A4F, #52b788);
  border-radius: 0 3px 3px 0;
  transition: width 0.1s linear;
  pointer-events: none;
}

.player-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px 14px;
  max-width: 900px;
  margin: 0 auto;
}

.player-btn-play {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #2D6A4F;
  border: none;
  color: #f5f1e6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding-left: 2px;
  transition: background 0.2s ease, transform 0.15s ease;
}
.player-btn-play:hover { background: #3a8a65; transform: scale(1.06); }

.player-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.player-title {
  font-family: 'Merriweather', serif;
  font-size: 14px;
  font-weight: 700;
  color: #ede3d4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-sub {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: rgba(192, 168, 130, 0.5);
  display: flex;
  align-items: center;
  gap: 6px;
}

.player-dot { opacity: 0.4; }

.player-time {
  font-variant-numeric: tabular-nums;
  color: rgba(192, 168, 130, 0.38);
}

.player-btn-close {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(192, 168, 130, 0.07);
  border: 1px solid rgba(192, 168, 130, 0.12);
  color: rgba(192, 168, 130, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.player-btn-close:hover {
  background: rgba(192, 168, 130, 0.14);
  border-color: rgba(192, 168, 130, 0.28);
  color: rgba(192, 168, 130, 0.85);
}

.player-slide-enter-active,
.player-slide-leave-active {
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.player-slide-enter-from,
.player-slide-leave-to {
  transform: translateY(100%);
}

.layout-root {
  transition: padding-bottom 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.layout-root--player-open {
  padding-bottom: 72px;
}
</style>
