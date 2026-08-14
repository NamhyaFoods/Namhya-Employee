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
        // "gray" is remapped end-to-end so the same role numbering (50 =
        // lightest role, 900 = darkest role) works for both themes — every
        // existing bg-gray-50 / text-gray-900 / border-gray-200 usage in the
        // app repolarizes automatically without touching each file. Values
        // come from CSS variables (src/styles/variables.css) that ThemeContext
        // swaps by toggling the `light` class on <html>; <alpha-value> lets
        // Tailwind still apply opacity modifiers like bg-gray-50/80.
        gray: {
          50: 'rgb(var(--color-gray-50) / <alpha-value>)',   // page background
          100: 'rgb(var(--color-gray-100) / <alpha-value>)', // subtle surface / hover fill
          200: 'rgb(var(--color-gray-200) / <alpha-value>)', // hairline borders, dividers
          300: 'rgb(var(--color-gray-300) / <alpha-value>)', // stronger borders, disabled fills
          400: 'rgb(var(--color-gray-400) / <alpha-value>)', // muted icons, placeholders
          500: 'rgb(var(--color-gray-500) / <alpha-value>)', // secondary text
          600: 'rgb(var(--color-gray-600) / <alpha-value>)', // body text
          700: 'rgb(var(--color-gray-700) / <alpha-value>)', // secondary headings
          800: 'rgb(var(--color-gray-800) / <alpha-value>)', // headings
          900: 'rgb(var(--color-gray-900) / <alpha-value>)', // primary text
        },
        // Card / nav / table surfaces — used in place of bg-white. Also
        // theme-variable-driven; see gray above.
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
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