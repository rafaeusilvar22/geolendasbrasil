export function useQuizShare(title: ComputedRef<string>, url: ComputedRef<string>) {
  const copySuccess = ref(false)

  const shareLinks = computed(() => ({
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title.value + ' — ' + url.value)}`,
    twitter: `https://x.com/intent/tweet?text=${encodeURIComponent(title.value)}&url=${encodeURIComponent(url.value)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url.value)}`,
  }))

  async function copyLink() {
    await navigator.clipboard.writeText(url.value)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  }

  return { shareLinks, copySuccess, copyLink }
}
