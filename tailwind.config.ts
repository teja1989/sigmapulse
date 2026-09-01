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
        background: "#080B11",
        surface: {
          50: "#1A2234",
          100: "#141B2D",
          200: "#0F1424",
          300: "#0B0F1A",
          400: "#070A12",
        },
        terminal: {
          green: "#00FF66",
          cyan: "#00F0FF",
          amber: "#FFB000",
          purple: "#A855F7",
          red: "#FF3366",
          blue: "#3B82F6",
          gold: "#FFD700",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          glow: "rgba(0, 240, 255, 0.2)",
          greenGlow: "rgba(0, 255, 102, 0.2)",
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(0, 240, 255, 0.25)',
        'glow-green': '0 0 15px -3px rgba(0, 255, 102, 0.25)',
        'glow-amber': '0 0 15px -3px rgba(255, 176, 0, 0.25)',
        'glow-red': '0 0 15px -3px rgba(255, 51, 102, 0.25)',
        'glow-purple': '0 0 15px -3px rgba(168, 85, 247, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticker': 'ticker 35s linear infinite',
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
