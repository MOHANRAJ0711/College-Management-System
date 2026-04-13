/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        premium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'premium-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'premium-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: 'oklch(0.966 0.015 258.8)',
          100: 'oklch(0.933 0.032 258.8)',
          200: 'oklch(0.865 0.063 258.8)',
          300: 'oklch(0.798 0.095 258.8)',
          400: 'oklch(0.73 0.126 258.8)',
          500: 'oklch(0.663 0.158 258.8)',
          600: 'oklch(0.596 0.189 258.8)',
          700: 'oklch(0.528 0.221 258.8)',
          800: 'oklch(0.461 0.252 258.8)',
          900: 'oklch(0.393 0.284 258.8)',
          950: 'oklch(0.326 0.315 258.8)',
        },
      },
    },
  },
  plugins: [],
}
