import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { plainText } from '@/lib/text';

export const prerender = true;

const SITE = 'https://www.pavan.blog';
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async () => {
  const posts = (await getCollection('articles')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
  const items = posts.map((p) => {
    const url = `${SITE}/articles/${p.slug}`;
    return `    <item>
      <title>${escape(p.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.data.date).toUTCString()}</pubDate>
      <description>${escape(plainText(p.data.excerpt))}</description>
    </item>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pavan Raheja — Articles</title>
    <link>${SITE}/articles</link>
    <description>Writing on AI agents, product management, and growth by Pavan Raheja.</description>
    <language>en</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date(posts[0]?.data.date ?? Date.now()).toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
