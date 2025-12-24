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
        sand: "rgb(var(--color-sand) / <alpha-value>)",
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        ember: "rgb(var(--color-ember) / <alpha-value>)",
        cream: "rgb(var(--color-cream) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"]
      },
      boxShadow: {
        soft: "0 18px 40px -28px rgba(22, 26, 24, 0.35)",
        glow: "0 0 0 1px rgba(33, 40, 36, 0.08), 0 18px 30px -24px rgba(52, 88, 74, 0.6)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        rise: "rise 0.8s ease-out both"
      }
    }
  },
  plugins: []
};

