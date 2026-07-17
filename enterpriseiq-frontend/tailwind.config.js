/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#151A2C',
        navy: {
          DEFAULT: '#1D2540',
          50: '#EEF0F6',
          100: '#D6DAE9',
          200: '#AEB6CE',
          400: '#5C6690',
          600: '#2A3358',
          700: '#1D2540',
          800: '#161B31',
          900: '#0F1322',
        },
        paper: '#EFEEE7',
        'paper-dim': '#E4E2D7',
        slate: {
          DEFAULT: '#5B6472',
          300: '#9AA1AE',
        },
        brass: {
          DEFAULT: '#A9803F',
          400: '#C39C5C',
          600: '#8A672F',
        },
        verified: {
          DEFAULT: '#3F6B52',
          100: '#DEE8DF',
          600: '#2E5140',
        },
        rust: '#A6462F',
        line: '#D8D5C7',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21, 26, 44, 0.04), 0 8px 24px -12px rgba(21, 26, 44, 0.18)',
        seal: '0 6px 20px -6px rgba(169, 128, 63, 0.45)',
      },
      keyframes: {
        stamp: {
          '0%': { transform: 'scale(2.2) rotate(-14deg)', opacity: '0' },
          '55%': { transform: 'scale(0.94) rotate(-4deg)', opacity: '1' },
          '75%': { transform: 'scale(1.04) rotate(-6deg)' },
          '100%': { transform: 'scale(1) rotate(-5deg)', opacity: '1' },
        },
        rise: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        stamp: 'stamp 0.6s cubic-bezier(.2,.8,.3,1.2) forwards',
        rise: 'rise 0.5s ease forwards',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
