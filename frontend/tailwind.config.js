/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent blue — primary interactive color across buttons, links,
        // active nav state, and chart series 1.
        primary: {
          50: '#EAF2FF',
          100: '#D6E7FF',
          200: '#ADCBFF',
          300: '#7FA9FF',
          400: '#5B8DFB',
          500: '#3B82F6',
          600: '#2F6FE0',
          700: '#2557B3',
          800: '#1E3A8A',
          900: '#16296B',
        },
        // Cyan — pairs with primary in the signature blue→cyan gradient
        // used on the sidebar mark, KPI accents, and chart glows.
        accent: {
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        // "gray" is remapped end-to-end for the dark theme: the numbering
        // (50 = lightest role, 900 = darkest role) is preserved so every
        // existing bg-gray-50 / text-gray-900 / border-gray-200 usage in
        // the app repolarizes automatically without touching each file.
        gray: {
          50: '#0A0F1D',   // page background
          100: '#111A2E',  // subtle surface / hover fill
          200: '#1E293F',  // hairline borders, dividers
          300: '#2C3B57',  // stronger borders, disabled fills
          400: '#64748B',  // muted icons, placeholders
          500: '#8B98AC',  // secondary text
          600: '#AEB9CC',  // body text
          700: '#CBD5E1',  // secondary headings
          800: '#E2E8F0',  // headings
          900: '#F8FAFC',  // primary text, near-white
        },
        // Card / nav / table surfaces — used in place of bg-white.
        surface: {
          DEFAULT: '#101A2E',
          elevated: '#16223B',
          hover: '#1B2842',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 24px -6px rgba(0,0,0,0.45)',
        glow: '0 0 0 1px rgba(59,130,246,0.15), 0 0 24px -4px rgba(59,130,246,0.35)',
        'glow-accent': '0 0 0 1px rgba(34,211,238,0.15), 0 0 24px -4px rgba(34,211,238,0.35)',
      },
      backgroundImage: {
        'gradient-signature': 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
        'gradient-radial-glow': 'radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 55%)',
      },
    },
  },
  plugins: [],
}