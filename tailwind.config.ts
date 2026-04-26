import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#2b201a',
        surface: '#352822',
        ember:   '#D4622A',
        gold:    '#C99B5A',
        cream:   '#F0E4CE',
        muted:   '#7A6A5A',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;