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
        brand: {
          pink: "#FDF2F4", // Soft blush pink
          "pink-accent": "#E6B8C0", // Slightly darker for borders/hovers
          green: "#1A3C34", // Deep forest green
          "green-light": "#2A594E",
          sage: "#A5B4A3", // Muted sage green
          ivory: "#FDFBF7", // Warm ivory/cream
          cream: "#F7F3EB",
          charcoal: "#2D2D2D",
          champagne: "#E8D8C8",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
};
export default config;
