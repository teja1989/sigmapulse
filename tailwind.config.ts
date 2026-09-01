import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: {
          50: "#1e293b",
          100: "#141d2e",
          200: "#0f1728",
          300: "#0b111e",
          400: "#070c16",
        },
        institutional: {
          blue: "#2563eb",
          sky: "#0284c7",
          emerald: "#10b981",
          crimson: "#ef4444",
          amber: "#f59e0b",
          indigo: "#6366f1",
          slate: "#64748b",
        },
        terminal: {
          green: "#10b981",
          cyan: "#0284c7",
          amber: "#f59e0b",
          purple: "#8b5cf6",
          red: "#ef4444",
          blue: "#2563eb",
          gold: "#d97706",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          card: "rgba(255, 255, 255, 0.12)",
          active: "#2563eb",
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 4px 0 rgba(0, 0, 0, 0.25)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.35)',
        'institutional': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticker': 'ticker 40s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
