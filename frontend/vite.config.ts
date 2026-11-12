import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        xfwd: true,
      },
      '/socket.io': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        ws: true,
        xfwd: true,
      },
    },
  },
});
