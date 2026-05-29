/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#e31e24", // CIMB Red
          dark: "#b9151b",
          light: "#ff4d52",
        },
        secondary: {
          DEFAULT: "#333333",
          dark: "#1a1a1a",
          light: "#4d4d4d",
        },
        risk: {
          low: "#00a651",      // Green
          medium: "#f97316",   // Orange
          high: "#e31e24",     // Red
        },
        neutral: {
          page: "#f9fafb",
          card: "#ffffff",
          border: "#e5e7eb",
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
