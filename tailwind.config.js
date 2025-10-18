/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./styles/**/*.css"],
  theme: {
    extend: {
      colors: {
        // Modern Cardiac Brand Colors
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          900: "#164e63",
        },
        clinical: {
          normal: "#10b981", // Emerald-500
          warning: "#f59e0b", // Amber-500
          critical: "#ef4444", // Red-500
          urgent: "#dc2626", // Red-600
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
    },
  },
  plugins: [],
  // Purge configuration for production
  purge: {
    enabled: process.env.NODE_ENV === "production",
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
      "./styles/**/*.css",
    ],
    options: {
      safelist: [
        // Keep clinical status classes
        "clinical-normal",
        "clinical-warning",
        "clinical-critical",
        "clinical-urgent",
        // Keep theme classes
        "theme-light",
        "theme-dark",
      ],
    },
  },
};
