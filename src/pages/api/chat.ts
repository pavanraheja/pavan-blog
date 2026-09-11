export const prerender = false;

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaMessageParam,
  BetaTextBlockParam,
  BetaTool,
  BetaToolResultBlockParam,
  BetaToolUseBlock,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { SYSTEM_PROMPT } from '@/lib/knowledge';
import { findAppliedRoles } from '@/lib/clone/roles';
import { captureEvent, env, notifyTelegram } from '@/lib/clone/notify';

const client = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') });

const MODEL = 'claude-opus-5';
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TOOL_ROUNDS = 4;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 30;
const POSTHOG_REPLAY_URL = 'https://eu.posthog.com/project/247453/replay/';

// Lead-alert bits: Telegram fires only when a visitor first shares a name or an email.
const LEAD_NAME = 1;
const LEAD_EMAIL = 2;

// Best-effort per-instance limit; stops a single client hammering the paid API.
const requestLog = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_MAX_REQUESTS;
}

const TOOLS: BetaTool[] = [
  {
    name: 'find_applied_roles',
    description:
      'Look up the roles Pavan has applied for at the company a recruiter or hiring manager says they are from. ' +
      'Returns found=false, or the company name and its roles — each with a title and, when available, a pitch: ' +
      'the angle Pavan\'s application for that role led with. Call it as soon as a recruiter names their company. ' +
      'Only the role titles at that one company may ever be mentioned to the visitor.',
    input_schema: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Company name as the visitor gave it' },
      },
      required: ['company'],
      additionalProperties: false,
    },
  },
  {
    name: 'save_visitor',
    description:
      'Save who the visitor is so Pavan can follow up personally. Call it as soon as you learn a name, email, company ' +
      'or clear purpose, and again whenever you learn more. Include every detail known so far on each call.',
    input_schema: {
      type: 'object',
      properties: {
        intent: { type: 'string', enum: ['recruiter', 'collaborator', 'exploring'] },
        purpose: { type: 'string', description: 'One line: what they want or are working on' },
        name: { type: 'string' },
        email: { type: 'string' },
        company: { type: 'string' },
        role: { type: 'string', description: 'The role being discussed, for recruiters' },
      },
      required: ['intent', 'purpose'],
      additionalProperties: false,
    },
  },
  {
    name: 'request_call',
    description:
      'Send Pavan a request for a call with this visitor. Use only once the visitor has said they want a call and has ' +
      'given an email, 2–3 time slots and their timezone. Pavan confirms the booking himself by email.',
    input_schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        topic: { type: 'string', description: 'One line: what they want to discuss' },
        timezone: { type: 'string', description: "The visitor's timezone, e.g. GMT+4 or Europe/London" },
        slots: { type: 'array', items: { type: 'string' }, description: "2–3 proposed time slots, in the visitor's words" },
        name: { type: 'string' },
        company: { type: 'string' },
      },
      required: ['email', 'topic', 'timezone', 'slots'],
      additionalProperties: false,
    },
  },
];

type Emit = (payload: Record<string, unknown>) => void;

interface ChatContext {
  distinctId: string;
  conversationId: string;
  sessionId: string | null;
  leadAlerted: number;
  emit: Emit;
}

async function runTool(block: BetaToolUseBlock, ctx: ChatContext): Promise<string> {
  const input = block.input as Record<string, string | undefined>;
  const base = { conversation_id: ctx.conversationId, $session_id: ctx.sessionId };

  if (block.name === 'find_applied_roles') {
    const match = findAppliedRoles(input.company ?? '');
    await captureEvent('clone_role_lookup', ctx.distinctId, {
      ...base,
      company_query: input.company,
      matched_company: match?.company ?? null,
      roles_found: match?.roles.length ?? 0,
    });
    return JSON.stringify(match ? { found: true, company: match.company, roles: match.roles } : { found: false });
  }

  if (block.name === 'save_visitor') {
    await captureEvent('clone_lead', ctx.distinctId, { ...base, ...input });
    // Lets the widget remember a returning visitor in their own browser.
    ctx.emit({ visitor: { name: input.name, company: input.company, role: input.role, intent: input.intent } });
    const known = (input.name ? LEAD_NAME : 0) | (input.email ? LEAD_EMAIL : 0);
    if (known & ~ctx.leadAlerted) {
      const lines = [
        `pavan.blog clone — ${input.intent ?? 'visitor'}`,
        input.name && `Name: ${input.name}`,
        (input.company || input.role) && `Company: ${[input.company, input.role].filter(Boolean).join(' · ')}`,
        input.email && `Email: ${input.email}`,
        input.purpose && `Purpose: ${input.purpose}`,
        ctx.sessionId && `Replay: ${POSTHOG_REPLAY_URL}${ctx.sessionId}`,
      ].filter(Boolean);
      if (await notifyTelegram(lines.join('\n'))) ctx.leadAlerted |= known;
    }
    return JSON.stringify({ saved: true });
  }

  if (block.name === 'request_call') {
    const call = block.input as { email?: string; topic?: string; timezone?: string; slots?: unknown; name?: string; company?: string };
    const slots = Array.isArray(call.slots) ? call.slots.slice(0, 5).map(String) : [];
    await captureEvent('clone_call_request', ctx.distinctId, {
      ...base,
      name: call.name,
      email: call.email,
      company: call.company,
      topic: call.topic,
      timezone: call.timezone,
      slots: slots.join(' | '),
    });
    const lines = [
      'pavan.blog clone — CALL REQUEST',
      call.name && `Name: ${call.name}`,
      call.company && `Company: ${call.company}`,
      `Email: ${call.email}`,
      `Topic: ${call.topic}`,
      `Timezone: ${call.timezone}`,
      ...slots.map((s, i) => `Slot ${i + 1}: ${s}`),
      ctx.sessionId && `Replay: ${POSTHOG_REPLAY_URL}${ctx.sessionId}`,
    ].filter(Boolean);
    await notifyTelegram(lines.join('\n'));
    return JSON.stringify({ requested: true });
  }

  return JSON.stringify({ error: `Unknown tool ${block.name}` });
}

function isValidMessages(messages: unknown): messages is { role: 'user' | 'assistant'; content: string }[] {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= MAX_MESSAGES &&
    messages.every(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length <= MAX_MESSAGE_CHARS,
    ) &&
    messages[messages.length - 1].role === 'user'
  );
}

// Details a returning visitor shared on an earlier visit, stored only in their browser.
function returningVisitorNote(visitor: unknown): string | null {
  if (!visitor || typeof visitor !== 'object') return null;
  const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').trim().slice(0, 80) : '');
  const v = visitor as Record<string, unknown>;
  const fields = [
    ['name', clean(v.name)],
    ['company', clean(v.company)],
    ['role', clean(v.role)],
    ['intent', clean(v.intent)],
  ].filter(([, value]) => value);
  if (!fields.some(([key]) => key === 'name')) return null;
  return (
    'RETURNING VISITOR — details they shared on an earlier visit, remembered in their browser (unverified): ' +
    fields.map(([key, value]) => `${key}: ${value}`).join('; ')
  );
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { messages } = body;
  if (!isValidMessages(messages)) {
    return new Response(JSON.stringify({ error: 'Invalid messages' }), { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
  }

  const conversationId = typeof body.conversationId === 'string' ? body.conversationId.slice(0, 64) : crypto.randomUUID();
  const distinctId =
    typeof body.distinctId === 'string' && body.distinctId ? body.distinctId.slice(0, 200) : conversationId;
  const sessionId = typeof body.sessionId === 'string' && body.sessionId ? body.sessionId.slice(0, 64) : null;
  const leadAlerted = typeof body.leadAlerted === 'number' ? body.leadAlerted & (LEAD_NAME | LEAD_EMAIL) : 0;

  const system: BetaTextBlockParam[] = [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }];
  const visitorNote = returningVisitorNote(body.visitor);
  if (visitorNote) system.push({ type: 'text', text: visitorNote });

  const history: BetaMessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      // Deltas are JSON-encoded so newlines inside the text never break SSE framing.
      const send: Emit = (payload) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      const ctx: ChatContext = { conversationId, distinctId, sessionId, leadAlerted, emit: send };
      let reply = '';
      const toolsUsed: string[] = [];
      let outcome = 'ok';

      try {
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          if (reply && !reply.endsWith('\n')) {
            reply += '\n\n';
            send({ t: '\n\n' });
          }
          const stream = client.beta.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            output_config: { effort: 'low' },
            system,
            tools: TOOLS,
            messages: history,
          });
          stream.on('streamEvent', (event) => {
            // Tell the widget a lookup is under way, so a tool round doesn't look like a stall.
            if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
              send({ status: event.content_block.name });
            }
          });
          stream.on('text', (delta) => {
            reply += delta;
            send({ t: delta });
          });
          const message = await stream.finalMessage();

          if (message.stop_reason === 'refusal') {
            outcome = 'refusal';
            const text = "I can't help with that one here — reach me directly at pavanraheja@gmail.com.";
            reply += text;
            send({ t: text });
            break;
          }
          if (message.stop_reason !== 'tool_use') break;

          history.push({ role: 'assistant', content: message.content });
          const toolUses = message.content.filter((b): b is BetaToolUseBlock => b.type === 'tool_use');
          const results: BetaToolResultBlockParam[] = await Promise.all(
            toolUses.map(async (b) => {
              toolsUsed.push(b.name);
              return { type: 'tool_result' as const, tool_use_id: b.id, content: await runTool(b, ctx) };
            }),
          );
          history.push({ role: 'user', content: results });
        }
        send({ done: true, leadAlerted: ctx.leadAlerted });
      } catch (err) {
        outcome = 'error';
        console.error('Chat API error:', err);
        send({ error: true, leadAlerted: ctx.leadAlerted });
      }

      await captureEvent('clone_turn', ctx.distinctId, {
        conversation_id: ctx.conversationId,
        $session_id: ctx.sessionId,
        turn: messages.filter((m) => m.role === 'user').length,
        user_message: messages[messages.length - 1].content,
        assistant_message: reply,
        tools_used: toolsUsed.join(','),
        outcome,
        returning_visitor: Boolean(visitorNote),
        page: typeof body.page === 'string' ? body.page.slice(0, 200) : null,
        model: MODEL,
        country: request.headers.get('x-vercel-ip-country'),
      });
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
};
