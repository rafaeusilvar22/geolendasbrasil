import daisyui from 'daisyui'

export default {
  content: [],
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        pergaminho: {
          primary: '#C9A24B',
          secondary: '#7A6A52',
          accent: '#4B6B5C',
          neutral: '#211C2E',
          'base-100': '#F2E9D8',
          'base-200': '#E8DCC4',
          'base-300': '#D9CBA8',
          info: '#4A4A7A',
          success: '#151225',
          warning: '#C9A24B',
          error: '#7C2D3B',
        },
      },
    ],
    defaultTheme: 'pergaminho',
  },
  theme: {
    extend: {
      colors: {
        terra: '#C9A24B',
        soil: '#7A6A52',
        forest: '#4B6B5C',
        deepforest: '#151225',
        water: '#4A4A7A',
        light: '#F2E9D8',
        brown: '#211C2E',
        tan: '#D9CBA8',
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
