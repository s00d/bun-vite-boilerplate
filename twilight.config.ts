// twilight.config.ts
import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{vue,ts,js}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6", // blue-500
        foreground: "#111827", // gray-900
        "muted-foreground": "#6b7280", // gray-500
        muted: "#f3f4f6", // gray-100
        border: "#d1d5db", // gray-300
        surface: "#ffffff", // white or gray-50
      },
    },
  },
} satisfies Config;

export default config;
