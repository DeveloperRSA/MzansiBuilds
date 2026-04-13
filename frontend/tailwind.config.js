/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your signature Mzansi Green
        mzansi: {
          DEFAULT: '#00df82', 
          glow: 'rgba(0, 223, 130, 0.2)',
        },
        darkBg: '#000000',
        cardBg: '#0a0a0a',
      },
    },
  },
  plugins: [],
}