/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tyrian: {
          deep:   '#0a0006',
          darker: '#14000c',
          dark:   '#1f0112',
          mid:    '#33011e',
          rich:   '#520230',
          vivid:  '#66023c',
        },
        obsidian: '#08070a',
        marble: {
          DEFAULT: '#f0ece3',
          dim:     '#c8bfb0',
          muted:   '#7a6e65',
        },
        gold: {
          DEFAULT: '#d4af5a',
          dim:     '#a07c30',
        },
      },
      fontFamily: {
        cinzel:    ['Cinzel', 'Trajan Pro', 'serif'],
        cormorant: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
  safelist: [
    // Tier text colors (dynamically constructed in components)
    'text-gold', 'text-marble-dim', 'text-blue-300', 'text-purple-300',
    // Tier badge background + border (dynamically constructed)
    'bg-tyrian-mid', 'bg-tyrian-dark', 'bg-tyrian-darker',
    'border-blue-700', 'border-purple-700',
  ],
}
