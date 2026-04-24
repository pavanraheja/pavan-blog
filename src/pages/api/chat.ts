export const prerender = false;

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '@/lib/knowledge';

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), { status: 400 });
    }

    console.log(JSON.stringify({
      event: 'chat_message',
      at: new Date().toISOString(),
      messageCount: messages.length,
      lastUserMessage: messages[messages.length - 1]?.content?.slice?.(0, 200) ?? null,
      country: request.headers.get('x-vercel-ip-country'),
      city: request.headers.get('x-vercel-ip-city'),
      ua: request.headers.get('user-agent')?.slice(0, 100) ?? null,
    }));

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(`data: ${chunk.delta.text}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
  } catch (err) {
    console.error('Chat API error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
