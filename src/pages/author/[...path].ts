import type { APIRoute } from 'astro';

export const prerender = false;

// Old WordPress author archive.
export const ALL: APIRoute = ({ redirect }) => redirect('/about', 301);
