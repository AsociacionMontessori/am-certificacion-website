/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: "#FBD116",
        orange: "#EC6A3D",
        blue: "#0097B2",
        gray: "#40424B",
        red: {
          DEFAULT: "#D90368",
          light: "#EB7DB1"
        },
        green: "#7ED957"
      }
    },
  },
  plugins: [require("daisyui")],
}

