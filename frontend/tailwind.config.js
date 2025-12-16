/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#F2F2F7', 
          100: '#E5E5EA',
          500: '#0D1117', // Near Black (style primary)
          600: '#000000', // True Black
        },
        accent: {
          500: '#10B981', // Emerald green for actions
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6', 
          200: '#E5E7EB',
          300: '#D1D5DB',
          500: '#6B7280',
          800: '#1F2937',
          900: '#111827',
        }
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.02)',
        'dropdown': '0 10px 40px -10px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
