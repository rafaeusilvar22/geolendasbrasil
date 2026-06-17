import daisyui from 'daisyui'

export default {
  content: [],
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        discovery: {
          primary: '#D4845C',
          secondary: '#8B6F47',
          accent: '#2D6A4F',
          neutral: '#1a1a1a',
          'base-100': '#f5f1e6',
          'base-200': '#e8e0d4',
          'base-300': '#d9cfc1',
          info: '#2E5090',
          success: '#1B4332',
          warning: '#D4845C',
          error: '#c9724a',
        },
      },
    ],
    defaultTheme: 'discovery',
  },
  theme: {
    extend: {
      colors: {
        terra: '#D4845C',
        soil: '#8B6F47',
        forest: '#2D6A4F',
        deepforest: '#1B4332',
        water: '#2E5090',
        light: '#f5f1e6',
        brown: '#3D2817',
        tan: '#E8D4B8',
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
