/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        tycoon: {
          light: '#fef9c3',
          DEFAULT: '#eab308',
          dark: '#a16207',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'gold': '0 4px 6px -1px rgba(234, 179, 8, 0.3), 0 2px 4px -1px rgba(234, 179, 8, 0.2)',
        'gold-lg': '0 10px 15px -3px rgba(234, 179, 8, 0.4), 0 4px 6px -2px rgba(234, 179, 8, 0.3)',
        'tycoon': '0 0 20px rgba(234, 179, 8, 0.5), 0 0 40px rgba(234, 179, 8, 0.3)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        'gradient-tycoon': 'linear-gradient(to right, #f59e0b, #eab308, #fbbf24)',
      }
    },
  },
  plugins: [],
}
