---
title: "The Architecture of a Self-Driving System"
date: "2026-07-17"
excerpt: "Replit's 'self-driving company' essay shows what agent fleets can do once trusted. This is the architecture underneath such a system — seven layers, drawn from one I operate in production, held together by two rules: no agent promotes itself, and no agent grants itself resources."
image: "/images/self-driving-architecture.png"
slug: "architecture-of-a-self-driving-system"
---

Amjad Masad published something this week that people will point back to for years: [The Self-Driving Company](https://x.com/amasad/status/2077802290304684404). Replit threaded agents through every function of the business, and the numbers are startling — nearly 3× code output per engineer with review latency and incident rates flat, agents reviewing PRs and root-causing incidents, support closing escalated tickets 60% faster. His best line: "People don't feel like they've been automated. They feel like they've been promoted."

The essay is about what agents can do once they're trusted. This piece is about the part underneath: **the architecture that makes a fleet of agents safe to trust** — how agents work independently, how they connect, and who is allowed to decide what. It's drawn from a production system I've operated for the past eighteen months, where agents research, act, and monitor with real stakes attached: real money, and real customers of a business that pays for the result.

The shape that emerged is seven layers. None of them is optional — I know, because each one was added after its absence hurt.

## The seven layers

```text
        ┌───────────────────  HUMAN  ───────────────────┐
        │  sets direction · fixed review cadence ·      │
        │  every promote / kill decision, audit-logged  │
        └───────▲───────────────▲───────────────────────┘
          escalations      decisions
                │               │
  ┌──────────┐   ┌───────┴─────┐   ┌───────────────┐
  │ PROPOSAL │──▶│ VALIDATION  │──▶│  EXECUTION    │
  │ research │   │ per-agent   │   │ staged        │
  │ agents   │   │ gates ·     │   │ autonomy ·    │
  │ discover │   │ nightly     │   │ kill-switch   │
  │ candidates│  │ review      │   │ armed         │
  └──────────┘   └─────────────┘   └───────┬───────┘
        ▲                                actions
        │       shared substrate            ▼
  ┌─────┴──────────────────────────────────────────────┐
  │ COORDINATION — central allocation · reservations ·  │
  │ conflict & duplicate guards                         │
  │ MEMORY — each agent's own knowledge file            │
  └─────────────────────────────────────────────────────┘
                    ▲ observes everything
  ┌─────────────────────────────────────────────────────┐
  │ MONITORING — throughput watchdogs · drift ·          │
  │ "silence is an incident"                             │
  └─────────────────────────────────────────────────────┘
```

**Proposal.** Research agents generate candidates: a weekly discovery sprint that hunts for new mechanisms, daily analysis jobs that mine the logs of everything already running and surface what's working and what's decaying. These agents have zero authority. They produce hypotheses with evidence attached — nothing they output can act.

**Validation.** Every candidate registers its own acceptance gates up front — the thresholds it must clear, the error tolerances it must hold — and a nightly review measures every candidate against its own criteria. The gates are falsification batteries, not happy-path demos: adversarial cases, held-out data, the input that looks like the training distribution but isn't. Over eighteen months, sixty-plus candidates have entered this layer. Four were promoted. A better-than-90% kill rate isn't waste; it's the layer doing its job.

**Execution.** Agents that act in the real world — but autonomy is staged, never granted whole. A promoted agent starts in shadow (decides, executes nothing), then supervised (acts, human confirms the consequential steps), then alone at minimum scope with a tested kill-switch armed. Authority expands only as live results match what the previous stage predicted.

**Coordination.** This is where interconnection actually lives. Execution agents don't talk to each other — they coordinate through governed shared state: a central allocation layer with reservations and conflict/duplicate guards, so eight parallel workstreams can draw on shared resources without ever colliding or double-spending. Before I built this layer, two agents once made overlapping claims on the same resource — each correct in isolation, wrong together. Independence in execution; connection through contracts.

**Memory.** Each agent maintains its own knowledge file — what it tried, what failed, what the numbers were, what decisions were taken and why. New runs start informed instead of naive, and learnings transfer across agents instead of evaporating when a process ends. Replit's data team built a semantic layer so anyone can query the warehouse; this is the same idea applied to agent experience.

**Monitoring.** Watchdogs observe every layer — and the most important thing they watch for is *nothing happening*. My worst production failure was an agent that stopped working for thirty hours without a single error: no exception, no alert, just silence. Every monitoring stack on earth is built to catch events; the dangerous failure mode of autonomous systems is the absence of one. The fix is throughput watchdogs: if an agent should have acted and didn't, that *is* the incident.

**Human.** One layer up from everything: direction, taste, and the two decisions no agent may make — promote and kill. A fixed review cadence (daily glance, weekly review, monthly deep-dive) rather than vibes-based check-ins, and every decision audit-logged with its reasoning.

## The two rules that hold it together

Strip away the detail and the architecture reduces to two constitutional rules:

**No agent promotes itself.** Proposal agents can't push candidates into execution. Execution agents can't expand their own scope. Even the best-performing agent in the fleet cannot grant itself more authority — promotion flows through the validation layer and a human decision, every time. Replit describes an agent that's learning to improve itself; I run the conservative version, and for systems whose mistakes are irreversible, I'd argue it's the only version: *propose* improvements freely, *grant* authority never.

**No agent grants itself resources.** Every claim on shared capacity goes through the coordination layer's reservations and guards. An agent that could allocate to itself is an agent that can starve the rest of the fleet — or double-commit what exists once.

Everything else — the gates, the ladders, the watchdogs — is implementation. These two rules are why a fleet of independent agents can run in parallel without a human standing over each one.

## Why the last gate is always live

One number from this system's history explains why validation can never end in a sandbox. A candidate once passed every offline check I had — backtests, held-out data, dry runs, flawless. Live, it failed. The post-mortem found its cost model was off by **266%**. Not 26 — 266. The entire apparent edge lived inside the gap between simulation and reality. So the final gate, for every agent, is a small, real, instrumented test — and the single most important number in the whole system is the delta between what an agent did live and what the previous stage predicted.

## Escalation is architecture too

The same pattern runs in a customer-facing system I built as a paid engagement: a WhatsApp assistant that answers, quotes, and books jobs for a services business, 24/7. Its escalation contract is the architecture in miniature — every draft reply is self-evaluated on two axes, confidence and sensitivity. High confidence *and* low sensitivity: send. Anything else: a human sees it first, and their decision feeds back into the system. Response times went from hours to seconds, and the human didn't get automated out of the loop — they moved up a layer, from writing every reply to examining the hard ones.

That's the "promoted, not automated" experience, produced by architecture rather than by hope.

## The scarce skill

Replit's essay is the best public evidence yet that the expected trade-off — more agent output means worse quality — doesn't have to occur. But as agent fleets spread beyond AI-native companies, I'd bet the scarce skill won't be spawning agents. It will be designing what sits around them: the layers, the contracts between them, and the two rules above.

I've written up the underlying discipline in detail, all of it drawn from systems I operate: [Evals for Agents That Act](/articles/evals-for-agents-that-act) (the promotion ladder), [Risk Guardian](/articles/risk-guardian-rfc-7218) (the pre-action safety gate), and [Building a Guardrailed AI Agent with Human-in-the-Loop](/articles/guardrailed-agent-human-in-the-loop) (the escalation contract, with a working workflow).

The self-driving company is coming. The ones that arrive intact will be the ones that were architected for it.
