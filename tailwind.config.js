/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        celestial: {
          950: '#04060c',
          900: '#070a14',
          850: '#0b0f1e',
          800: '#10162a',
          750: '#171f3a',
          700: '#1e294d',
          600: '#2d3b6e',
          500: '#435596',
        },
        violet: {
          glow: '#9d4edd',
          vivid: '#8b5cf6',
          soft: '#c084fc',
          muted: '#a78bfa',
          mist: '#ddd6fe',
        },
        lunar: {
          gold: '#f6d860',
          amber: '#f59e0b',
          star: '#fbbf24',
          silver: '#e2e8f0',
          ice: '#38bdf8',
          cyan: '#22d3ee',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(139, 92, 246, 0.25)',
        'glow-md': '0 0 25px -4px rgba(139, 92, 246, 0.35)',
        'glow-lg': '0 0 40px -6px rgba(139, 92, 246, 0.45)',
        'glow-gold': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'glow-cyan': '0 0 25px -4px rgba(56, 189, 248, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'nebula-gradient': 'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15), transparent 60%), radial-gradient(ellipse at bottom, rgba(56, 189, 248, 0.1), transparent 60%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
