import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#c8dfe9",
        panel: "#f7fbfc",
        mist: "#e7f2f5",
        primary: "#24586a",
        cyan: "#78b8c6",
        ink: "#163547",
        muted: "#5f7380",
        line: "#b8cdd6",
        danger: "#b85d4f",
        warning: "#a96b3c",
        sage: "#4f7f78"
      },
      boxShadow: {
        soft: "0 18px 38px rgba(22, 53, 71, 0.10)",
        glow: "0 18px 42px rgba(36, 88, 106, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
