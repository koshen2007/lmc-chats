/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0E14",
        surface: "#151922",
        "surface-2": "#1A1F2A",
        "surface-3": "#11151E",
        border: "#1F2430",
        accent: "#6366F1",
        "accent-soft": "#818CF8",
        muted: "#77808F",
      },
    },
  },
  plugins: [],
};

