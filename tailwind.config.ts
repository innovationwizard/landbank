import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forma: {
          950: "#0a0f1a",
          900: "#111827",
          800: "#1a2332",
          700: "#243044",
          600: "#334155",
          500: "#475569",
          400: "#64748b",
          300: "#94a3b8",
          200: "#cbd5e1",
          100: "#e8edf3",
          50: "#f1f5f9",
        },
        accent: {
          DEFAULT: "#c8a456",
          light: "#dbb96e",
          dark: "#a8883e",
          50: "#faf6eb",
        },
        danger: "#dc2626",
        success: "#16a34a",
        warning: "#d97706",
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
