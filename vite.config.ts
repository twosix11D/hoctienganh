import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Quan trọng: Giúp app chạy được trên file hệ thống (Android/iOS) hoặc GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: false, // Tắt sourcemap để giấu code gốc khi build
    chunkSizeWarningLimit: 1600,
  },
  define: {
    // Hỗ trợ các thư viện cũ dùng process.env
    'process.env': {} 
  }
});