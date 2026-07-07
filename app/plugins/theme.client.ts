export default defineNuxtPlugin(() => {
  const { setTheme } = useTheme()
  const saved = localStorage.getItem('theme')
  if (saved === 'forest') {
    setTheme('penumbra')
  } else if (saved === 'discovery') {
    setTheme('pergaminho')
  } else if (saved === 'penumbra' || saved === 'pergaminho') {
    setTheme(saved)
  }
})
