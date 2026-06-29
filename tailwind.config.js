/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090D',
          card: 'rgba(17, 17, 24, 0.7)',
          border: 'rgba(255, 255, 255, 0.06)',
          cardHover: 'rgba(26, 26, 36, 0.8)',
        },
        accent: {
          blue: '#3B82F6', // Blue-500
          indigo: '#6366F1', // Indigo-500
          purple: '#8B5CF6', // Purple-500
          emerald: '#10B981', // Emerald-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'neon': '0 0 15px rgba(139, 92, 246, 0.25)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.25)',
      },
      backdropBlur: {
        'glass': '12px',
      }
    },
  },
  plugins: [],
}
