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
        // FaceIT color system
        "faceit-darker": "#0c0d0f",
        "faceit-dark": "#121316",
        "faceit-card": "#1a1b1f",
        "faceit-card-hover": "#22242a",
        "faceit-border": "#282a32",
        "faceit-border-light": "#393c46",
        "faceit-orange": "#FF5500",
        "faceit-orange-hover": "#FF6B1A",
        "faceit-orange-dark": "#E04B00",
        "faceit-muted": "#8d939e",
        
        // Theme backward compatibility mapping to FaceIT
        "cs-dark": "#121316",
        "cs-darker": "#0c0d0f",
        "cs-card": "#1a1b1f",
        "cs-border": "#282a32",
        "cs-red": "#FF5500", // FaceIT Orange as primary accent
        "cs-blue": "#3b82f6",
        "cs-green": "#10b981",
        "cs-yellow": "#f59e0b",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "faceit-orange": "0 0 25px rgba(255, 85, 0, 0.25)",
        "faceit-card": "0 4px 20px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
