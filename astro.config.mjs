import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://westontariopaving.com',
  base: process.env.BASE ?? '/',
  trailingSlash: 'always',
  outDir: './dist',
  build: { assets: '_a', inlineStylesheets: 'always' },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
