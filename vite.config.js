import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/api': path.resolve(__dirname, './src/lib/api'),
      '@/services': path.resolve(__dirname, './src/lib/services'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/logger': path.resolve(__dirname, './src/lib/logger'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    // Phase 1.3: CSS Bundle Optimization
    target: 'esnext',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    reportCompressedSize: true,

    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        // More aggressive compression
        passes: 2,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: true,
      format: {
        comments: false,
      }
    },

    rollupOptions: {
      output: {
        // Phase 2: Component Code Splitting
        manualChunks: (id) => {
          // Vendor chunks - split large dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'vendor-react'
            }
            if (id.includes('react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('react-router-dom')) {
              return 'vendor-routing'
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
              return 'vendor-ui'
            }
            if (id.includes('recharts')) {
              return 'vendor-charts'
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('zod')) {
              return 'vendor-validation'
            }
            if (id.includes('react-hook-form')) {
              return 'vendor-forms'
            }
            // Group other vendors
            return 'vendor-other'
          }
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|gif|svg/.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          } else if (ext === 'css') {
            return `css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    },

    // CSS optimization - Phase 1.3 enhancements
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    // CSS minification options for aggressive optimization
    cssTarget: ['chrome90', 'firefox88', 'safari15'],

    // Chunk size warnings - tuned for optimization
    chunkSizeWarningLimit: 500, // KB

    // Rollup chunk size optimization
    outDir: 'dist',
    emptyOutDir: true,
  },
})
