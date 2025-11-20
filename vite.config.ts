import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode. 
  // process.cwd() requires @types/node to be installed (added in package.json)
  // Cast process to any to avoid conflict with client-side process type definition in vite-env.d.ts
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: './', 
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
    },
    define: {
      // This replaces process.env.API_KEY in the client-side code with the actual string value at build time
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    }
  };
});