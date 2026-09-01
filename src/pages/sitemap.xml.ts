import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const SITE = 'https://www.pavan.blog';
const STATIC_PAGES = ['', '/work', '/articles', '/newsletter', '/about'];

export const GET: APIRoute = async () => {
  const posts = await getCollection('articles');
  const urls = [
    ...STATIC_PAGES.map((p) => ({ loc: `${SITE}${p}`, lastmod: undefined as string | undefined })),
    ...posts.map((p) => ({
      loc: `${SITE}/articles/${p.slug}`,
      lastmod: p.data.date,
    })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`
  )
  .join('\n')}
</urlset>`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
