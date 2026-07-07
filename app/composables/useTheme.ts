export type Theme = 'pergaminho' | 'penumbra'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'pergaminho')

  function setTheme(t: Theme) {
    theme.value = t
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', t)
      localStorage.setItem('theme', t)
    }
  }

  function toggle() {
    setTheme(theme.value === 'pergaminho' ? 'penumbra' : 'pergaminho')
  }

  return { theme, setTheme, toggle }
}
