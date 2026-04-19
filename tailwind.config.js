/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Consolidated color palette to reduce unused CSS
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          300: '#d1d5db',
          400: '#9ca3af',
          600: '#6b7280',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          500: '#10b981',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#ef4444',
        },
      },
      animation: {
        // Optimized animations
        'spin': 'spin 0.6s linear infinite',
        'slideInRight': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
  // Phase 1.3: Aggressive purge configuration
  safelist: [
    // Always include common interactive states
    'hover:bg-gray-100',
    'hover:border-gray-400',
    'focus:outline-none',
    'focus:border-blue-500',
    'disabled:cursor-not-allowed',
    'disabled:bg-gray-300',
  ],
}
