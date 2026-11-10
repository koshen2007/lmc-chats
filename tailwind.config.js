/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'from-[#005C4B]', 'to-[#007A64]',
    'from-[#6366F1]', 'to-[#4F46E5]',
    'from-[#E11D48]', 'to-[#BE123C]',
    'from-[#0284C7]', 'to-[#0369A1]',
    'from-[#8B5CF6]', 'to-[#7C3AED]',
    'from-[#334155]', 'to-[#1E293B]',
    'bg-gradient-to-r',
    'bg-[#141824]', 'text-[#E9ECF4]',
    'text-[#E9F5EE]', 'text-white', 'text-[#F1F5F9]',
    'border-[#232B3E]',
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

