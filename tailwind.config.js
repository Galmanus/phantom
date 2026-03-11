/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // === PHANTOM Design System ===

        // Backgrounds — layered darkness with amber undertone
        void: '#0A0800',
        surface: '#110F04',
        panel: '#1A1600',
        
        // Borders
        subtle: '#2A2510',
        'subtle-2': '#3A3520',
        'subtle-3': '#4A4530',

        // Primary: Bitcoin Amber
        amber: {
          DEFAULT: '#F5A623',
          dim: '#8B5E14',
          glow: 'rgba(245, 166, 35, 0.15)',
          'glow-strong': 'rgba(245, 166, 35, 0.3)',
        },

        // Secondary: ZK Green
        'zk-green': {
          DEFAULT: '#39FF14',
          dim: '#1A7A08',
        },

        // Text
        parchment: '#F5F0E8',
        secondary: '#A89B80',
        muted: '#5C5240',

        // Semantic states
        success: '#39FF14',
        warning: '#F5A623',
        error: '#FF3B30',
        pending: '#60A5FA',

        // Legacy support (for existing components)
        text: '#F5F0E8',
        'text-muted': '#A89B80',
        'text-subtle': '#5C5240',
        border: 'rgba(255, 255, 255, 0.055)',
        'border-2': 'rgba(255, 255, 255, 0.09)',
        'border-3': 'rgba(255, 255, 255, 0.14)',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        heading: ['var(--font-syne)', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      spacing: {
        'section-padding-y': 'py-28 md:py-36',
        'section-padding-x': 'px-6 md:px-10 lg:px-16',
        'content-max-width': 'max-w-7xl mx-auto',
        'card-padding': 'p-8 md:p-10',
        'card-gap': 'gap-px',
      },
      animation: {
        'shield-pulse': 'shield-pulse 3s ease-in-out infinite',
        'amber-glow': 'amber-glow 2s ease-in-out infinite',
        'float-up': 'float-up 6s ease-in-out infinite',
        'page-enter': 'page-enter 250ms ease-out forwards',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
      },
      boxShadow: {
        'amber-glow': '0 0 20px rgba(245, 166, 35, 0.15)',
        'amber-glow-strong': '0 0 40px rgba(245, 166, 35, 0.3)',
        'green-glow': '0 0 20px rgba(57, 255, 20, 0.2)',
      },
    },
  },
  plugins: [],
}
