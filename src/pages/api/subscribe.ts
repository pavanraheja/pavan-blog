export const prerender = false;

import type { APIRoute } from 'astro';

const ML_BASE = 'https://connect.mailerlite.com/api';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, name, hp } = await request.json();

    if (typeof hp === 'string' && hp.length > 0) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
    }

    const token = import.meta.env.MAILERLITE_API_TOKEN;
    const groupId = import.meta.env.MAILERLITE_GROUP_ID;
    if (!token || !groupId) {
      console.error('subscribe: missing MAILERLITE_API_TOKEN or MAILERLITE_GROUP_ID');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
    }

    const body: Record<string, unknown> = {
      email,
      groups: [groupId],
      status: 'active',
    };
    if (typeof name === 'string' && name.trim()) {
      body.fields = { name: name.trim() };
    }

    const res = await fetch(`${ML_BASE}/subscribers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('subscribe: mailerlite error', res.status, data);
      const message = (data as { message?: string }).message ?? 'Subscription failed';
      return new Response(JSON.stringify({ error: message }), { status: res.status });
    }

    console.log(JSON.stringify({
      event: 'subscribe',
      at: new Date().toISOString(),
      email,
      country: request.headers.get('x-vercel-ip-country'),
      city: request.headers.get('x-vercel-ip-city'),
    }));

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('subscribe: handler error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
