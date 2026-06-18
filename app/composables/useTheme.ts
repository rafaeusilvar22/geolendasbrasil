export type Theme = 'discovery' | 'forest'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'discovery')

  function setTheme(t: Theme) {
    theme.value = t
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', t)
      localStorage.setItem('theme', t)
    }
  }

  function toggle() {
    setTheme(theme.value === 'discovery' ? 'forest' : 'discovery')
  }

  return { theme, setTheme, toggle }
}
