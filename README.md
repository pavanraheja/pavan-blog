# pavan.blog

Personal site for [Pavan Raheja](https://pavan.blog) — AI Product Manager — including a **digital clone**: a streaming conversational agent that answers questions about my work.

**Live:** [pavan.blog](https://pavan.blog)

---

## The digital clone

The interesting part of this repo. A visitor can ask the site questions and get answers grounded in a curated knowledge base, streamed token-by-token.

**Said no to RAG.** 20+ articles and a structured career history fit cleanly into a static knowledge base that ships with the bundle. No vector DB, no embedding pipeline, no retrieval step to debug or drift — the whole knowledge base is a single reviewed file. Retrieval infrastructure buys you nothing at this scale, and costs you a component that can silently return the wrong context.

Design decisions worth naming:

- **Streaming over SSE** from a Vercel serverless function, so first token arrives fast instead of waiting on a full completion.
- **Suggested questions** on the empty state — a blank chat box gets far less engagement than three good starting questions.
- **A graceful contact fallback.** When the clone hits the edge of what it knows, it says so and routes to a real conversation, rather than inventing an answer. Knowing where the agent stops is part of the product.

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (static + serverless islands) |
| Styling | Tailwind |
| Agent | Claude API (`claude-sonnet-4-6`), streaming |
| Hosting | Vercel |
| Analytics | PostHog (EU cloud) |

## Structure

```
src/
  pages/          # index, work, about, articles, newsletter
  pages/api/      # chat.ts — streaming clone endpoint
  content/        # articles as markdown (Astro content collections)
  lib/knowledge.ts # the clone's knowledge base
public/
  llms.txt        # machine-readable summary for AI answer engines
```

## Running locally

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
npm run dev
```

Then open http://localhost:4321. The clone endpoint needs the API key; the rest of the site renders without it.

```bash
npm run build    # production build
```

## Related

- [alphagrid-orchestrator](https://github.com/pavanraheja/alphagrid-orchestrator) — the production pattern for deploying autonomous systems safely
- [autonomous-execution-agents](https://github.com/pavanraheja/autonomous-execution-agents) — the multi-strategy execution fleet

## License

MIT — see [LICENSE](LICENSE).
