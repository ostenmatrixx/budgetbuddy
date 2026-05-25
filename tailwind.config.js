/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cornsilk: "#FFFFFF",
        ecru: "#F6D5D5",
        "light-red": "#F3A6A6",
        maroon: "#A64242",
        "black-bean": "#321818"
      }
    }
  },
  plugins: []
};
