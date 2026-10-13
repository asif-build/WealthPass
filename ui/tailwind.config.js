/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#DEDBC8",
        royal: {
          DEFAULT: "#0755C9",
          card: "#0646AD",
          dark: "#083B8A",
          subtle: "#EAF2FF",
        },
        navy: {
          deep: "#102A56",
          dark: "#111827",
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
      },
    },
  },
  plugins: [],
}
