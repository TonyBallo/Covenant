/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        covenant: {
          purple: '#6B46C1',
          gold: '#D4AF37',
          dark: '#1A202C',
        }
      }
    },
  },
  plugins: [],
  safelist: [
    'bg-orange-100', 'text-orange-600', 'text-orange-800',
    'bg-gray-100', 'text-gray-600', 'text-gray-800',
    'bg-yellow-100', 'text-yellow-600', 'text-yellow-800',
    'bg-blue-100', 'text-blue-600', 'text-blue-800',
    'bg-purple-100', 'text-purple-600', 'text-purple-800',
  ]
}
