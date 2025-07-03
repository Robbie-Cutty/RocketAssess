import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/RocketAssess/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 👈 Enables '@/components' shorthand
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external connections
    open: true,
    proxy: {
      // Proxy API requests to Django backend
      '/api': {
        target: process.env.VITE_API_URL || 'http://0.0.0.0:8000/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://192.168.1.71:8000'
    ),
  },
});