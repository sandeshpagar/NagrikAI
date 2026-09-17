import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1d4ed8", // Accessible vibrant royal navy
          container: "#e0e7ff", // Soft indigo-blue container
          foreground: "#ffffff",
          "on-primary": "#ffffff",
          "on-container": "#1e3a8a",
          fixed: "#dce1ff",
          "fixed-dim": "#b6c4ff",
        },
        secondary: {
          DEFAULT: "#0d9488", // Vibrant teal
          container: "#ccfbf1", // Soft teal container
          foreground: "#ffffff",
          "on-secondary": "#ffffff",
          "on-container": "#115e59",
          fixed: "#89f5e7",
          "fixed-dim": "#6bd8cb",
        },
        tertiary: {
          DEFAULT: "#4f46e5", // Modern AI indigo
          container: "#ede9fe", // Soft lavender container
          foreground: "#ffffff",
          "on-tertiary": "#ffffff",
          "on-container": "#3730a3",
          fixed: "#e1e0ff",
          "fixed-dim": "#c0c1ff",
        },
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-tertiary": "#ffffff",
        "on-error": "#ffffff",
        surface: {
          DEFAULT: "#faf8ff",
          dim: "#d2d9f4",
          bright: "#faf8ff",
          variant: "#dae2fd",
          tint: "#4059aa",
          "container-lowest": "#ffffff",
          "container-low": "#f4f6fb",
          container: "#eef2f8",
          "container-high": "#e2e8f0",
          "container-highest": "#cbd5e1",
        },
        "on-surface": {
          DEFAULT: "#0f172a",
          variant: "#334155",
        },
        "inverse-surface": "#1e293b",
        "inverse-on-surface": "#f8fafc",
        "inverse-primary": "#93c5fd",
        error: {
          DEFAULT: "#dc2626",
          container: "#fee2e2",
          foreground: "#ffffff",
          "on-error": "#ffffff",
          "on-container": "#991b1b",
        },
        outline: {
          DEFAULT: "#94a3b8",
          variant: "#cbd5e1",
        },
        // Civic and government contextual badges
        civic: {
          navy: "#0B2545",
          blue: "#134074",
          teal: "#10B981",
          amber: "#F59E0B",
          crimson: "#EF4444",
          indigo: "#6366F1",
        },
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        elevated: "0 4px 12px -2px rgba(0, 35, 111, 0.08), 0 2px 6px -2px rgba(0, 35, 111, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
