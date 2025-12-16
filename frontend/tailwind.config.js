/** @type {import('tailwindcss').Config} */
// SAFE UI CHANGE — NO LOGIC IMPACT
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Keep Inter
      },
      colors: {
        // Fresha-inspired Palette
        primary: {
          50: '#f4f7fa',
          100: '#e3e8f0',
          500: '#0f172a', // Dark Navy (Text/Primary Actions)
          600: '#020617', // Black/Midnight
        },
        accent: {
          500: '#22c55e', // Success Green (Booking confirmed)
          600: '#16a34a',
        },
        gray: {
          50: '#f9fafb', // Background
          100: '#f3f4f6', // Cards
          200: '#e5e7eb', // Borders
          500: '#6b7280', // Subtext
          900: '#111827', // Headings
        }
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',
      }
    },
  },
  plugins: [],
}
