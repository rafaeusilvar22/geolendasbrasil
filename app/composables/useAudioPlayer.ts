export interface AudioTrack {
  url: string
  title: string
  category?: string
}

export function useAudioPlayer() {
  const track = useState<AudioTrack | null>('audio-player-track', () => null)
  const isOpen = useState<boolean>('audio-player-open', () => false)
  const playTrigger = useState<number>('audio-player-trigger', () => 0)

  function play(t: AudioTrack) {
    track.value = t
    isOpen.value = true
    playTrigger.value++
  }

  function close() {
    isOpen.value = false
  }

  return { track, isOpen, playTrigger, play, close }
}
