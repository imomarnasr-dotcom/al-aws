/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand - Saudi Colors
        'royal-green': '#006C35',
        'royal-gold':  '#D4AF37',
        'royal-dark':  '#004D25',
        'royal-white': '#F8FAFC',
        'royal-light': '#E8F3EE',
        // Text
        'text-primary':   '#111827',
        'text-secondary': '#4B5563',
        'text-muted':     '#9CA3AF',
        // Surface
        'surface':        '#FFFFFF',
        'surface-raised': '#F8FAFC',
        // Status
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444',
        'info': '#3B82F6',
      },
      fontFamily: {
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-royal': 'linear-gradient(135deg, #006C35 0%, #004D25 100%)',
        'gradient-gold':  'linear-gradient(135deg, #D4AF37 0%, #B8960A 100%)',
        'gradient-app':   'linear-gradient(160deg, #F0FDF4 0%, #F8FAFC 50%, #FFF9E6 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-danger': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        'pattern-islamic': 'radial-gradient(circle at 20% 50%, rgba(0, 108, 53, 0.03) 0%, rgba(0, 108, 53, 0) 50%), radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.02) 0%, rgba(212, 175, 55, 0) 50%)',
        'pattern-subtle': 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0, 108, 53, 0.02) 35px, rgba(0, 108, 53, 0.02) 70px)',
      },
      boxShadow: {
        'glass':  '0 4px 24px rgba(0,0,0,0.06)',
        'card':   '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.06)',
        'gold':   '0 0 20px rgba(212,175,55,0.25)',
        'active': '0 4px 12px rgba(0,108,53,0.2)',
        'hover':  '0 8px 24px rgba(0,108,53,0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-up':    'fadeUp 0.35s cubic-bezier(0.4,0,0.2,1) both',
        'fade-in':    'fadeIn 0.3s ease-out both',
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'scale-in':   'scaleIn 0.2s ease both',
        'slide-up':   'slideUp 0.4s ease-out both',
        'bounce-subtle': 'bounceSubtle 0.8s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shake':      'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.93)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,175,55,0.25)' },
          '50%': { boxShadow: '0 0 30px rgba(212,175,55,0.4)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
};
