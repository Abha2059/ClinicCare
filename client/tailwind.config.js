/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ClinicCare brand — calm clinical teal
        brand: {
          50: '#eefbf7',
          100: '#d5f5eb',
          200: '#aeead9',
          300: '#79d9c1',
          400: '#43c0a4',
          500: '#1fa68a',
          600: '#12856f',
          700: '#106b5b',
          800: '#11554a',
          900: '#0f473e',
        },
        // Supporting deep navy for text/headers
        ink: {
          50: '#f5f7fa',
          100: '#e9edf3',
          200: '#cfd8e3',
          300: '#a8b8cb',
          400: '#7a91ad',
          500: '#5a7393',
          600: '#465b79',
          700: '#3a4a62',
          800: '#334053',
          900: '#1c2534',
        },
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
