import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cwd } from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load các biến môi trường từ file .env
  // mode: 'development' hoặc 'production'
  const env = loadEnv(mode, cwd(), '');

  return {
    plugins: [react()],
    base: './', // Quan trọng cho đường dẫn tương đối
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
    },
    define: {
      // Map biến VITE_API_KEY từ file .env vào process.env.API_KEY để code logic dùng được
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    }
  };
});