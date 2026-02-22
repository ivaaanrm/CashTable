/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        poker: {
          felt: '#0f3f2b',    // deep table green
          dark: '#0a2a1c',    // darker edges
          light: '#165c40',   // highlight green
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        chip: {
          red: '#dc2626',     // negative/alert
          blue: '#2563eb',    // neutral/info
          black: '#171717',   // dark chip
          white: '#f9fafb',   // light chip
        }
      },
      backgroundImage: {
        'table-felt': "radial-gradient(circle at center, var(--tw-gradient-stops))",
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out forwards',
        'fade-in': 'fadeIn 0.15s ease-out forwards',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
