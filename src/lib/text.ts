// Article excerpts were imported from WordPress and some still carry markdown; search snippets and the
// RSS feed need plain text, and search engines cut descriptions at roughly 155 characters.

export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(^|\s)#{1,6}(?=\s)/g, '$1')
    .replace(/\*\*|__|\*|`/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function metaDescription(markdown: string, max = 155): string {
  const text = plainText(markdown);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.—-]+$/, '')}…`;
}
