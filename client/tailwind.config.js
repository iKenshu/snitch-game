/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'flicker': 'flicker 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.15s ease-in-out infinite',
        'hand-hover': 'hand-hover 2.5s ease-in-out infinite',
        'hand-eager': 'hand-eager 0.8s ease-in-out infinite',
        'hand-grab': 'hand-grab 0.2s ease-in-out infinite',
        'snitch-hover': 'snitch-hover 4s ease-in-out infinite',
        'snitch-glow': 'snitch-glow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
          '75%': { opacity: '0.7' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg) scale(1)' },
          '50%': { transform: 'rotate(2deg) scale(1.02)' },
        },
        'hand-hover': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-5px) rotate(1deg)' },
          '75%': { transform: 'translateY(3px) rotate(-1deg)' },
        },
        'hand-eager': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-8px) scale(1.03)' },
        },
        'hand-grab': {
          '0%, 100%': { transform: 'scale(1) rotate(-1deg)' },
          '25%': { transform: 'scale(1.05) rotate(1deg)' },
          '50%': { transform: 'scale(1.02) rotate(-2deg)' },
          '75%': { transform: 'scale(1.04) rotate(2deg)' },
        },
        'snitch-hover': {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '20%': { transform: 'translateY(-8px) translateX(3px) rotate(1deg)' },
          '40%': { transform: 'translateY(-4px) translateX(-5px) rotate(-1deg)' },
          '60%': { transform: 'translateY(-10px) translateX(2px) rotate(0.5deg)' },
          '80%': { transform: 'translateY(-3px) translateX(-3px) rotate(-0.5deg)' },
        },
        'snitch-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
      },
      colors: {
        'quidditch-gold': '#FFD700',
        'quidditch-dark-gold': '#B8860B',
        'pitch': {
          600: '#1f5c35',
          700: '#1a472a',
          800: '#163d24',
          900: '#0f2e1a',
          950: '#091a0f',
        },
      },
    },
  },
  plugins: [],
}
