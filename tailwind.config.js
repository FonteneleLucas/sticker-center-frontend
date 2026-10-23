/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBF7F2',
          100: '#F5ECE0',
          200: '#EAD6BE',
          300: '#DFB992',
          400: '#D4A87A',
          500: '#C69563',
          600: '#B07D4B',
          700: '#8F6238',
          800: '#6E4B2B',
          900: '#4F351F',
        },
        obsidian: {
          950: '#070605',
          900: '#0C0A09',
          850: '#141210',
          800: '#1B1815',
          700: '#27221E',
          600: '#38312B',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(223, 185, 146, 0.12)',
        glow: '0 0 28px rgba(223, 185, 146, 0.18)',
      },
    },
  },
  plugins: [],
};
