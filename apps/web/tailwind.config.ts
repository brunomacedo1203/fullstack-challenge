import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Gaming color palette - dark background with vibrant accents
        background: '#0a0a0f',
        foreground: '#f0f0f0',
        muted: '#1a1a24',
        primary: {
          DEFAULT: '#00ff88', // Neon green
          foreground: '#0a0a0f',
        },
        secondary: {
          DEFAULT: '#ff6b35', // Vibrant orange
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#ffd700', // Gold/yellow
          foreground: '#0a0a0f',
        },
        border: '#2a2a3a',
        input: '#2a2a3a',
        ring: '#00ff88',
        // Gaming specific colors
        gaming: {
          dark: '#0a0a0f',
          darker: '#050508',
          light: '#1a1a24',
          neon: {
            green: '#00ff88',
            orange: '#ff6b35',
            yellow: '#ffd700',
            blue: '#00d4ff',
            pink: '#ff00ff',
          },
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        gaming: ['Orbitron', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-green': '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88',
        'neon-orange': '0 0 10px #ff6b35, 0 0 20px #ff6b35, 0 0 30px #ff6b35',
        'neon-yellow': '0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700',
        glow: '0 0 15px rgba(0, 255, 136, 0.5)',
      },
      backgroundImage: {
        'gradient-gaming': 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
        'gradient-gaming-orange': 'linear-gradient(135deg, #ff6b35 0%, #ffd700 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #1a1a24 100%)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
