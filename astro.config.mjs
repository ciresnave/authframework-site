import { defineConfig } from 'astro/config';
import { SITE } from './src/config.ts';

export default defineConfig({
  site: `https://${SITE.domain}`,
  trailingSlash: 'never',
  // Every script and stylesheet ships as a FILE so public/_headers can enforce
  // `script-src 'self'; style-src 'self'` with no 'unsafe-inline'. tests/security.spec.ts pins it.
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
