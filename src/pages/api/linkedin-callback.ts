export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');

  const safe = (s: string | null) =>
    s ? s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c)) : '';

  let body: string;
  if (error) {
    body = `
      <h1 style="color:#d00;margin:0 0 12px;">OAuth Error</h1>
      <p style="margin:0 0 6px;"><strong>Error:</strong> ${safe(error)}</p>
      <p style="margin:0 0 6px;"><strong>Description:</strong> ${safe(errorDescription) || '(none)'}</p>
      <p style="color:#888;font-size:13px;margin-top:18px;">Copy this entire URL and paste it back to Claude so we can debug:</p>
      <textarea readonly style="width:100%;height:80px;font-family:monospace;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:12px;" onclick="this.select()">${safe(url.toString())}</textarea>
    `;
  } else if (code) {
    body = `
      <h1 style="color:#080;margin:0 0 12px;">✓ Authorization successful</h1>
      <p style="margin:0 0 14px;">Copy the entire URL below and paste it back to Claude — he'll exchange it for an access token.</p>
      <textarea readonly style="width:100%;height:120px;font-family:monospace;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:12px;" onclick="this.select()">${safe(url.toString())}</textarea>
      <p style="color:#888;font-size:12px;margin-top:18px;">Click inside the box to auto-select, then ⌘+C to copy.</p>
    `;
  } else {
    body = `
      <h1 style="margin:0 0 12px;">LinkedIn OAuth Callback</h1>
      <p>No <code>code</code> or <code>error</code> in the URL. Did you arrive here directly from LinkedIn?</p>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>LinkedIn OAuth — pavan.blog</title>
  <meta name="robots" content="noindex">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:640px;margin:60px auto;padding:24px;color:#1a1a1a;line-height:1.5;">
  ${body}
  <hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
  <p style="color:#aaa;font-size:11px;">State: ${safe(state) || 'n/a'}</p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
