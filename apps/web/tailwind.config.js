const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontSize: {
        ...defaultTheme.fontSize,
        xs: ["var(--fs-caption)", { lineHeight: "1.45" }],
        sm: ["var(--fs-small)", { lineHeight: "1.55" }],
        base: ["var(--fs-body)", { lineHeight: "1.65" }],
        "2xl": ["var(--fs-title-sm)", { lineHeight: "1.2" }],
        "3xl": ["var(--fs-title-md)", { lineHeight: "1.15" }]
      },
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
