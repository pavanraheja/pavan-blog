import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

// Old WordPress post URLs (/yyyy/mm/dd/slug/, plus /amp, /feed and /embed variants) still rank in search and sit
// in backlinks. Each goes to its article; renamed slugs resolve through ALIASES, shortened ones by prefix.
const ALIASES: Record<string, string> = {
  'opinion-and-empathy-bill-bullard': 'opinion-and-empathy',
  'growth-strategy-for-clear-app-learnings-from-capstone': 'growth-strategy-clear',
};

export const ALL: APIRoute = async ({ params, redirect }) => {
  const isDate = /^\d{4}$/.test(params.year ?? '') && /^\d{2}$/.test(params.month ?? '') && /^\d{2}$/.test(params.day ?? '');
  if (!isDate) return new Response('Not found', { status: 404 });

  let segment = (params.path ?? '').split('/')[0];
  try {
    segment = decodeURIComponent(segment);
  } catch {
    // keep the raw segment
  }
  const slug = segment.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const slugs = (await getCollection('articles')).map((p) => p.slug);
  const target =
    slugs.find((s) => s === slug) ??
    ALIASES[slug] ??
    slugs.find((s) => s.length >= 30 && slug.startsWith(s));
  return redirect(target ? `/articles/${target}` : '/articles', 301);
};
