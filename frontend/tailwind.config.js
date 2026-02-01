/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2E7D32",
        secondary: "#4DB6AC",
        background: "#F7F7F4",
        text: "#2B2B2B",
        accent: "#F9A825",
      },
    },
  },
  plugins: [],
};