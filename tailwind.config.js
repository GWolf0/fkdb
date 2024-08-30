/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode:'class',
  theme: {
    extend: {
      colors:{
        light:"#E7E5E4",
        lighter:"#F5F5F4",
        lightest:"#FAFAF9",
        dark:"#334155",
        darker:"#1E293B",
        darkest:"#0F172A",
        primary:"#6366F1",
        accent:"#3B82F6",
        secondary:"#EC4899",
        semitrans:"rgba(1,1,1,0.25)",
        info:"#22C55E",
        error:"#EF4444",
        warning:"#F59E0B",
      },
      aspectRatio:{
        portrait:'0.5'
      }
    },
  },
  plugins: [],
}