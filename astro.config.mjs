import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind()],
  site: 'https://www.pavan.blog',
  // Old feed file names. Config redirects match exact paths only, so old WordPress URLs ending in "/"
  // (posts, pages, tags, feeds) are redirected by server routes in src/pages instead.
  redirects: {
    '/feed.xml': { status: 301, destination: '/rss.xml' },
    '/atom.xml': { status: 301, destination: '/rss.xml' },
  },
});
