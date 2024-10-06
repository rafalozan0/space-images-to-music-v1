// client/tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'], // Asegúrate de que esta ruta sea correcta
  theme: {
    extend: {
      colors: {
        cosmic: {
          DEFAULT: '#1a1a2e',
          light: '#16213e',
          dark: '#0f3460',
          accent: '#e94560',
        },
      },
    },
  },
  plugins: [],
};