// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy charting library — only loaded on Analytics/Dashboard
          recharts: ['recharts'],
          // React core — stable, cached long-term
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
