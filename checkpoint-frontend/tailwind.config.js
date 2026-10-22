const scale = (name) =>
  Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [n, `rgb(var(--${name}-${n}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      // slate and indigo follow the active theme (Morning, Dawn or Night),
      // so every page picks up the theme without per-page changes.
      colors: {
        slate: scale("slate"),
        indigo: scale("indigo"),
      },
    },
  },
  plugins: [],
};
