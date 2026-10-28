import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    optimizeDeps: {
      include: ['react-is'],
    },
    server: {
      // HMR is completely disabled to prevent mobile clients and external tunnels
      // from constantly triggering location.reload() when WebSockets disconnect.
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
