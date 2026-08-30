/** @type {import('tailwindcss').Config} */

/**
 * Colours are driven by CSS variables so a single `.dark` class on <html>
 * re-themes the whole app. Each step maps to a variable defined in index.css;
 * in dark mode the `ink` scale is inverted (900 becomes the lightest) which
 * flips every existing `text-ink-900` / `bg-ink-50` usage automatically.
 */
const inkScale = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [
    step,
    `rgb(var(--ink-${step}) / <alpha-value>)`,
  ]),
)

const brandScale = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [
    step,
    `rgb(var(--brand-${step}) / <alpha-value>)`,
  ]),
)

/**
 * Status palettes (red/amber/emerald/sky). Tailwind's defaults are kept for
 * every step except the ones this app uses on themed surfaces, which become
 * variables so alert boxes and status text stay legible in dark mode.
 */
function statusScale(name) {
  const variable = (step) => `rgb(var(--${name}-${step}) / <alpha-value>)`
  return {
    50: variable(50),
    100: variable(100),
    200: variable(200),
    300: variable(300),
    400: variable(400),
    500: variable(500),
    600: variable(600),
    700: variable(700),
    800: variable(800),
    900: variable(900),
  }
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ClinicCare brand — calm clinical teal
        brand: brandScale,
        // Supporting deep navy for text/headers (inverted in dark mode)
        ink: inkScale,
        // Page and card surfaces — replaces bare `white` so panels re-theme.
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',
        },
        /**
         * Status colours. Only the steps the app actually uses are overridden:
         * the -50 tint (alert backgrounds) and the -600/-700 text pairing.
         * Defining them as variables means every existing `bg-red-50` /
         * `text-red-700` re-themes without touching the components.
         */
        red: statusScale('red'),
        amber: statusScale('amber'),
        emerald: statusScale('emerald'),
        sky: statusScale('sky'),
        accent: {
          50: '#fff6ed',
          100: '#ffead4',
          200: '#fdd1a8',
          300: '#fbb171',
          400: '#f88838',
          500: '#f66b13',
          600: '#e75109',
          700: '#bf3b0a',
          800: '#983010',
          900: '#7b2a10',
        },
      },
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem',
        18: '4.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.12)',
        'card-hover': '0 2px 4px rgba(16,24,40,.06), 0 18px 40px -16px rgba(16,24,40,.22)',
        pop: '0 12px 32px -8px rgba(16,24,40,.18)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'slide-in-right': {
          '0%': { opacity: 0, transform: 'translateX(16px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out',
        'fade-up': 'fade-up .35s ease-out',
        'slide-in-right': 'slide-in-right .25s ease-out',
      },
    },
  },
  plugins: [],
}
