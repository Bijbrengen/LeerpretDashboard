import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  outDir: './dist',
  emptyOutDir: true,
  base: process.env.GITHUB_ACTIONS ? '/LeerpretDashboard/' : '/',
});
