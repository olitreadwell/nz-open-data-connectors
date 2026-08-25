import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite config for the Dolly Parton memorial SPA, deployed to GitHub Pages
 * under the repository base path.
 *
 * @returns Vite configuration
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/nz-open-data-connectors/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
