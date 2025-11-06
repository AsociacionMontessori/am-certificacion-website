import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#641ae6",
          "secondary": "#d926a9",
          "accent": "#1fb2a6",
          "neutral": "#40424B",
          "base-100": "#40424B",
          "info": "#40424B",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
      },
      maxHeight: {
        '128': '30rem',
      }
    },
  },
  plugins: [daisyui],
}
