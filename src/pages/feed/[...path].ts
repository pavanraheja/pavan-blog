import type { APIRoute } from 'astro';

export const prerender = false;

// Old WordPress feeds (/feed/, /feed/atom/).
export const ALL: APIRoute = ({ redirect }) => redirect('/rss.xml', 301);
