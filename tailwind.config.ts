import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const rgbVar = (name: string, shade: string) => `rgb(var(--${name}-${shade}) / <alpha-value>)`;

const zincShades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

const themedAccents: Record<string, string[]> = {
  emerald: ["100", "200", "300", "400"],
  red: ["100", "200", "300", "400"],
  amber: ["200", "300", "400"],
  sky: ["200", "300", "400"],
  purple: ["300", "400"],
  violet: ["200", "400"],
  rose: ["400"],
  cyan: ["400"],
  blue: ["300", "400"],
};

const themedColors = {
  zinc: Object.fromEntries(zincShades.map((shade) => [shade, rgbVar("zinc", shade)])),
  ...Object.fromEntries(
    Object.entries(themedAccents).map(([name, shades]) => [
      name,
      Object.fromEntries(shades.map((shade) => [shade, rgbVar(name, shade)])),
    ]),
  ),
};

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          card: "rgb(var(--surface-card) / <alpha-value>)",
          border: "rgb(var(--surface-border) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "#10b981",
          soft: "#34d399",
        },
        ...themedColors,
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.2s ease-out",
      },
    },
  },
  plugins: [typography],
};

export default config;
