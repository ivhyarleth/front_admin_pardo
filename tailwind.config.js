/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pardos-brown': '#8B1A1A',
        'pardos-yellow': '#F2B10C',
        'pardos-orange': '#F67C1F',
        'pardos-purple': '#4C1F2F',
        'pardos-rust': '#B34726',
        'pardos-dark': '#262626',
        'pardos-cream': '#FFF3E0',
        'pardos-gray': '#E0E0E0',
        'pardos-olive': '#6C7A3F',
      },
      fontFamily: {
        'spartan': ['League Spartan', 'sans-serif'],
        'lato': ['Lato', 'sans-serif'],
        'pacifico': ['Pacifico', 'cursive'],
      },
    },
  },
  plugins: [],
}
