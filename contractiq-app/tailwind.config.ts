import type { Config } from 'tailwindcss'

// Design tokens sourced from docs/design.md — the ContractIQ design system,
// extended with a dark theme (docs/design.md "Dark theme" section). Every
// shade resolves through a CSS variable (app/globals.css, :root / .dark) so
// existing utility classes (bg-ink-900, text-indigo-500, ...) automatically
// repaint when the `dark` class toggles on <html> — no component changes
// needed. Variables hold "R G B" triplets (not hex) so Tailwind's opacity
// modifiers (bg-indigo-500/10) keep working via rgb(var(...) / <alpha-value>).
function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`
}

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: withOpacity('--color-ink-900'),
          700: withOpacity('--color-ink-700'),
          500: withOpacity('--color-ink-500'),
          300: withOpacity('--color-ink-300'),
          100: withOpacity('--color-ink-100'),
          50: withOpacity('--color-ink-50'),
        },
        indigo: {
          900: withOpacity('--color-indigo-900'),
          700: withOpacity('--color-indigo-700'),
          500: withOpacity('--color-indigo-500'),
          300: withOpacity('--color-indigo-300'),
          100: withOpacity('--color-indigo-100'),
          50: withOpacity('--color-indigo-50'),
        },
        green: {
          900: withOpacity('--color-green-900'),
          500: withOpacity('--color-green-500'),
          100: withOpacity('--color-green-100'),
          50: withOpacity('--color-green-50'),
        },
        amber: {
          900: withOpacity('--color-amber-900'),
          500: withOpacity('--color-amber-500'),
          100: withOpacity('--color-amber-100'),
          50: withOpacity('--color-amber-50'),
        },
        red: {
          900: withOpacity('--color-red-900'),
          500: withOpacity('--color-red-500'),
          100: withOpacity('--color-red-100'),
          50: withOpacity('--color-red-50'),
        },
        paper: {
          DEFAULT: withOpacity('--color-paper'),
          white: withOpacity('--color-paper-white'),
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
