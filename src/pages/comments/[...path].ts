import type { APIRoute } from 'astro';

export const prerender = false;

// Old WordPress comments feed (/comments/feed/).
export const ALL: APIRoute = ({ redirect }) => redirect('/rss.xml', 301);
