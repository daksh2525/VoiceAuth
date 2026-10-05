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
        cyber: {
          900: '#070913',
          800: '#0c1021',
          700: '#141a33',
          600: '#1c2447',
          500: '#2b3668',
        },
        neon: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#a855f7',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'soundwave': 'soundwave 1.2s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.4), inset 0 0 15px rgba(0, 242, 254, 0.2)'
          },
          '50%': {
            opacity: '0.7',
            boxShadow: '0 0 50px rgba(0, 242, 254, 0.8), inset 0 0 25px rgba(0, 242, 254, 0.4)'
          },
        },
        soundwave: {
          '0%': { height: '15%' },
          '100%': { height: '100%' }
        }
      }
    },
  },
  plugins: [],
};
