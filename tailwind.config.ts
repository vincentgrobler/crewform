/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CrewForm design tokens
        brand: {
          primary: '#1F6FEB',
          hover: '#388BFD',
          muted: 'rgba(31, 111, 235, 0.1)',
        },
        surface: {
          primary: '#0D1117',
          card: '#161B22',
          elevated: '#1C2128',
          overlay: '#21262D',
        },
        status: {
          success: '#238636',
          'success-text': '#3FB950',
          warning: '#9E6A03',
          'warning-text': '#D29922',
          error: '#DA3633',
          'error-text': '#F85149',
          idle: '#484F58',
        },
        border: {
          DEFAULT: '#30363D',
          muted: '#21262D',
          emphasis: '#8B949E',
        },
        priority: {
          urgent: '#FF7B72',
          high: '#D29922',
          medium: '#388BFD',
          low: '#8B949E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
