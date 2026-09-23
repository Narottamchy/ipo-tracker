/** @type {import('tailwindcss').Config} */
function withOpacity(varName) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? `rgb(var(${varName}))` : `rgb(var(${varName}) / ${opacityValue})`;
}

function scale(name, steps) {
  return Object.fromEntries(steps.map((step) => [step, withOpacity(`--${name}-${step}`)]));
}

export default {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        ink: scale('ink', [950, 900, 850, 800, 700, 600, 500, 400, 300, 200, 100]),
        brand: scale('brand', [950, 900, 800, 700, 600, 500, 400, 300, 200, 100]),
        amber: scale('amber', [400]),
      },
      boxShadow: {
        card: '0 8px 40px -12px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
