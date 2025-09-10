// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',          // subdomain deploy, so base is root
  server: { https: false } // mkcert not needed on Vercel
});