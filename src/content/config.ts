import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    slug: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { articles };
