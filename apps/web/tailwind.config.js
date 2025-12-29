/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        forest: "rgb(var(--color-forest) / <alpha-value>)",
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        sun: "rgb(var(--color-sun) / <alpha-value>)",
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"]
      }
    }
  },
  plugins: []
};
