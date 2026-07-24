import type { Config } from 'tailwindcss'

// Design tokens sourced 1:1 from docs/design.md — the ContractIQ design system.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#1C1F26',
          700: '#454A56',
          500: '#767C8A',
          300: '#C4C8D0',
          100: '#EEEFF2',
          50: '#F5F5F3',
        },
        indigo: {
          900: '#1B2266',
          700: '#2B3AAE',
          500: '#3B4FE0',
          300: '#A3AEF3',
          100: '#E4E7FC',
          50: '#F1F2FE',
        },
        green: {
          900: '#0F5C3D',
          500: '#1B8A5A',
          100: '#E7F6EE',
          50: '#F2FAF5',
        },
        amber: {
          900: '#8A5A12',
          500: '#B7791F',
          100: '#FDF3E0',
          50: '#FEF8ED',
        },
        red: {
          900: '#8F2C2C',
          500: '#C23B3B',
          100: '#FBEAEA',
          50: '#FDF4F4',
        },
        paper: {
          DEFAULT: '#FAFAF7',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['var(--font-newsreader)', 'serif'],
        sans: ['var(--font-instrument-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        pill: '999px',
        doc: '4px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(28, 31, 38, 0.06)',
        md: '0 4px 10px rgba(28, 31, 38, 0.08)',
        lg: '0 12px 32px rgba(28, 31, 38, 0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
