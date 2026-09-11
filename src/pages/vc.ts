import type { APIRoute } from 'astro';

export const prerender = false;

// Old WordPress page.
export const ALL: APIRoute = ({ redirect }) => redirect('/work', 301);
