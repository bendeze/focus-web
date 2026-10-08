/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#000000',
          surface: '#141416',
          card: '#1B1B1E',
          fill: '#222226',
          border: '#2A2A2E',
          borderSubtle: '#38383E',
          text: '#FFFFFF',
          textSecondary: '#A0A0A0',
          textMuted: '#6B6B76',
        },
        light: {
          bg: '#FFFFFF',
          surface: '#F5F5F7',
          card: '#FFFFFF',
          fill: '#EAEAEA',
          border: '#E0E0E5',
          borderSubtle: '#D0D0D5',
          text: '#000000',
          textSecondary: '#757575',
          textMuted: '#9E9E9E',
        }
      },
      letterSpacing: {
        brand: '0.25em',
        badge: '0.15em',
      },
      borderRadius: {
        'pill': '9999px',
        'sheet': '36px',
        '2xl': '20px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
