import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f8f7ff",
        panel: "#ffffff",
        mist: "#eef2ff",
        primary: "#0f56d9",
        cyan: "#06b6d4",
        ink: "#171923",
        muted: "#62677a",
        line: "#dde2f2",
        danger: "#dc2626",
        warning: "#b45309",
        sage: "#0f766e"
      },
      boxShadow: {
        soft: "0 20px 50px rgba(15, 23, 42, 0.06)",
        glow: "0 20px 50px rgba(37, 99, 235, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
