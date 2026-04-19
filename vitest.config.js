import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportOnFailure: true,
      exclude: [
        'node_modules/',
        'dist/',
        'src/test/',
        'src/**/index.js',
        '**/*.test.js',
        '**/*.test.jsx',
        '**/__tests__/**',
        '**/mocks/**',
        '**/factories.js',
        '**/helpers.js',
      ],
      include: ['src/**/*.js', 'src/**/*.jsx'],
      all: true,
      lines: 70,
      functions: 90,
      branches: 70,
      statements: 70,
      perFile: true,
      watermarks: {
        lines: [70, 90],
        functions: [70, 90],
        branches: [70, 90],
        statements: [70, 90],
      },
    },
    include: ['src/**/*.test.js', 'src/**/*.test.jsx', 'src/**/__tests__/**'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
