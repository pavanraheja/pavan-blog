import type { APIRoute } from 'astro';

export const prerender = false;

// Old WordPress tag archives still appear in search results.
export const ALL: APIRoute = ({ redirect }) => redirect('/articles', 301);
