/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f1f5f9',
          dark: '#000000'
        },
        surface: {
          light: '#ffffff',
          dark: '#0a0a0a'
        },
        primary: {
          DEFAULT: '#047857',
          dark: '#064e3b'
        },
        secondary: {
          DEFAULT: '#065f46',
          dark: '#064e3b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
