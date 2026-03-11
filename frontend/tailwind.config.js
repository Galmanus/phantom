/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090909',
        surface: '#111111',
        border: '#1E1E1E',
        primary: '#7C3AED',
        secondary: '#06B6D4',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: '#F1F5F9',
        textMuted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        hero: ['64px', { fontWeight: '700' }],
        title: ['32px', { fontWeight: '700' }],
        section: ['20px', { fontWeight: '600' }],
        body: ['15px', { fontWeight: '400' }],
        label: ['11px', { fontWeight: '500', letterSpacing: '0.08em' }],
        code: ['13px', { fontFamily: 'JetBrains Mono' }],
      },
    },
  },
  plugins: [],
};
