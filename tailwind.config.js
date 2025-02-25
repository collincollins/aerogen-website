/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(29, 73, 167)',
        'primary-dark': 'rgb(21, 54, 126)',
        accent: 'rgb(95, 179, 249)',
      },
      fontFamily: {
        sans: ['aileron', 'sans-serif'],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(to right, rgb(29, 73, 167), rgb(95, 179, 249))',
      },
    },
  },
  plugins: [],
} 