/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#07100c',
          900: '#0b1512',
          850: '#0e1a16',
          800: '#121f1a',
          700: '#182a23',
          600: '#22362e',
          500: '#324a40',
          400: '#5c7368',
          300: '#8ba296',
          200: '#b9ccc0',
          100: '#dfe9e2',
        },
        brand: {
          950: '#04150d',
          900: '#0a2318',
          800: '#0f3324',
          700: '#154732',
          600: '#1b6a49',
          500: '#22855b',
          400: '#2fa26f',
          300: '#5cc797',
          200: '#9be3bf',
          100: '#d3f5e3',
        },
        amber: {
          400: '#f2b84f',
        },
      },
      boxShadow: {
        card: '0 8px 40px -12px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
