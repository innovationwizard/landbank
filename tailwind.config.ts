import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Elite architect palette — warm off-white to deep ink.
        // 50-300: backgrounds and surfaces (alabaster -> chalk)
        // 400-500: borders, disabled, muted text (putty / graphite)
        // 600-950: body and heading text (slate -> carbon)
        forma: {
          50:  "#FAF8F3", // alabaster
          100: "#F1EDE4", // bone
          200: "#E6E1D3", // limestone
          300: "#CFC8B6", // chalk
          400: "#A19B8A", // putty
          500: "#6A6558", // graphite
          600: "#4A463D", // slate
          700: "#2E2B25", // ink
          800: "#1C1B18", // obsidian
          900: "#12110F", // carbon
          950: "#080706", // near-black
        },
        accent: {
          DEFAULT: "#8B5A3C", // walnut
          light:   "#A67A5B", // tobacco
          dark:    "#6B4423", // burnt umber
          50:      "#F3ECE1", // walnut wash
        },
        success: "#4A5D3F", // moss
        warning: "#B8935A", // aged brass
        danger:  "#8C3A2E", // rust
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
