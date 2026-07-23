/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Deep teal + slate system (see src/styles/tokens.css for the source of truth) ----
        ink: '#16232B',          // primary text (was near-black navy)
        navy: {                   // dark surfaces / primary buttons — now "deep teal"
          DEFAULT: '#0F3D3E',
          50: '#E9F5F2',
          100: '#CFE9E3',
          200: '#9FD3C7',
          400: '#1E8F63',
          600: '#125550',
          700: '#0F3D3E',
          800: '#0B2E2F',
          900: '#082625',
        },
        paper: '#F6F8F9',          // page background — pale slate-white
        'paper-dim': '#ECF1F1',
        slate: {
          DEFAULT: '#52667A',
          300: '#93A3B1',
        },
        brass: {                    // secondary accent — warm amber, kept distinct from the
                                     // verified-green so status pills stay legible next to each other
          DEFAULT: '#C99A3E',
          400: '#DCB667',
          600: '#A87C2C',
        },
        verified: {
          DEFAULT: '#1E8F63',
          100: '#DCF5EA',
          600: '#146B52',
        },
        rust: '#C1483A',
        line: '#DCE6E4',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 61, 62, 0.05), 0 8px 24px -12px rgba(15, 61, 62, 0.18)',
        seal: '0 6px 20px -6px rgba(43, 182, 115, 0.45)',
        glow: '0 0 0 1px rgba(43, 182, 115, 0.25), 0 8px 30px -8px rgba(43, 182, 115, 0.35)',
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
