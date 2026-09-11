// Server-side side effects for the digital clone: PostHog event capture and Telegram alerts.

const POSTHOG_CAPTURE_URL = 'https://eu.i.posthog.com/i/v0/e/';
// Public, write-only project token — the same one the browser snippet in Layout.astro uses.
const POSTHOG_PROJECT_TOKEN = 'phc_maPUeEbP8NYsvtxELGhXJuPEBgs4y3b29W7znGBbdFqc';

export function env(name: string): string | undefined {
  return process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name];
}

export async function captureEvent(
  event: string,
  distinctId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  try {
    const res = await fetch(POSTHOG_CAPTURE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_PROJECT_TOKEN,
        event,
        distinct_id: distinctId,
        properties: { site: 'pavan_blog', environment: env('VERCEL_ENV') ?? 'local', ...properties },
        timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) console.error('posthog capture failed', event, res.status);
  } catch (err) {
    console.error('posthog capture error', event, err);
  }
}

// Returns true only when Telegram confirms delivery in the response body —
// an HTTP 200 alone is not proof (the CallMeBot lesson).
export async function notifyTelegram(text: string): Promise<boolean> {
  const token = env('TELEGRAM_BOT_TOKEN');
  const chatId = env('TELEGRAM_CHAT_ID');
  if (!token || !chatId) {
    console.log(JSON.stringify({ event: 'telegram_skipped_no_credentials', preview: text.slice(0, 120) }));
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (!data?.ok) console.error('telegram send failed', res.status, data?.description);
    return Boolean(data?.ok);
  } catch (err) {
    console.error('telegram send error', err);
    return false;
  }
}
