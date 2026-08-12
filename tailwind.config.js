/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8f5e9',
          100: '#c8e6c9',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
        }
      }
    },
  },
  plugins: [],
  // prevent conflicts with Angular Material
  corePlugins: {
    preflight: false,
  }
};
