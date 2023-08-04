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
      },
      spacing: {
        '-241': '-241px',
        '144': '144px',
      },
      dropShadow: {
        '3xl': '0 35px 35px rgba(0, 0, 0, 0.25)',
        '4xl': [
          '0 35px 35px rgba(0, 0, 0, 1)',
          '0 45px 65px rgba(0, 0, 0, 1)'
        ]
      }
    },
  },
  plugins: [require("daisyui")],
}

