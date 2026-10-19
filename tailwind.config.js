/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          void: '#08080c',
          panel: '#10121a',
          cyan: '#00f0ff',
          magenta: '#ff007f',
          amber: '#ffb800',
          crimson: '#ff2a6d',
        },
      },
    },
  },
  plugins: [],
}
