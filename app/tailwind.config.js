/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/views/**/*.ejs", "./src/public/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4f7",
          100: "#fbe8ee",
          200: "#f6d0dd",
          300: "#eeacc2",
          400: "#e283a3",
          500: "#d15c84",
          600: "#b8426a",
          700: "#963455",
          800: "#7a2c47",
          900: "#66263c",
          950: "#3b1521"
        },
        accent: {
          50: "#fff9f0",
          100: "#ffefd6",
          200: "#ffdca8",
          300: "#ffc476",
          400: "#feab47",
          500: "#f0922a",
          600: "#cf7318",
          700: "#a85a14",
          800: "#874917",
          900: "#703d16"
        }
      },
      fontFamily: {
        sans: ["Poppins", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
