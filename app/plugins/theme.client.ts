export default defineNuxtPlugin(() => {
  const { setTheme } = useTheme()
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved === 'forest' || saved === 'discovery') {
    setTheme(saved)
  }
})
