---
title: "Case Study: Building and Governing Agents That Act on Real Money"
date: "2026-08-03"
excerpt: "Glasshouse is an agent platform I built alone and have run in production for two years across four venues. This is the engineering and governance case study — the evaluation ladder, the three theses I killed with the arithmetic, and the failure that changed the architecture. No returns, because returns aren't the point."
slug: "glasshouse-case-study"
---

Most AI case studies describe what shipped. This one is mostly about what didn't — because in a system where agents act with real money, the decision to *not* ship is the one that compounds.

**Glasshouse** is a multi-venue agent platform I designed, built and operate alone. It has run in production for roughly two years across four venues — **Binance** and **Bybit** (centralised exchanges), **Hyperliquid** (on-chain perpetuals), **Polymarket** (on-chain USDC settlement) and **Kalshi** (an exchange-cleared event market). Agents research, validate, execute and reconcile. I am the product manager, the engineer, and the person paged at 3am.

What follows is the part that transfers to any AI product: how the thing is governed, how candidates are evaluated, and what happened when the governance wasn't good enough.

*One thing this case study deliberately does not contain: performance figures. No returns, no client names, no pricing. The engineering is the story, and financial results are both unverifiable to a reader and beside the point.*

---

## 1. The insight the architecture is built on

In 2024, most of the effort in the agent space went into making models smarter. I became convinced the binding constraint was different: **autonomous agents don't fail because the model is weak. They fail because nothing governs them.**

There is usually no answer to the two questions that actually matter in production:

- *May this agent act right now?*
- *What happens when it's wrong?*

So I inverted the usual build order. I built the orchestration and evaluation layer first, and the agents second. The product is the governance; the intelligence is a component inside it.

That decision is why the system is still running.

---

## 2. One canonical model over four incompatible APIs

The first engineering problem was integration sprawl. Each venue has its own semantics — REST and WebSocket, different order lifecycles, different notions of position, different failure behaviour. The naive approach is one bespoke integration per venue, and it doesn't scale past two.

Instead there is **one canonical internal model** — a single representation of an order, a position, and a settlement — with thin adapters translating each venue into it.

The payoff is structural: **onboarding a new venue became configuration rather than a rebuild.** Every downstream component — risk screening, reconciliation, monitoring, audit — was written once against the canonical model and works on any venue added afterwards.

This is the same problem shape as any platform that integrates fragmented external systems, and it's the part of the work I'd bring to a product team first.

---

## 3. The governance ladder

Autonomy is not a switch. In Glasshouse it's a ladder, and nothing skips a rung:

**Shadow** → the agent runs and records what it *would* have done. No side effects.
**Supervised** → the agent proposes; a human approves each action.
**Autonomous** → the agent acts within pre-registered limits.

Layered across all three:

- **Capability boundaries** — an explicit distinction between what an agent may *propose* and what it may *decide*. Most production incidents I've seen elsewhere trace back to this line never being drawn.
- **Human-in-the-loop on anything irreversible.** Not on anything *uncertain* — on anything *irreversible*. Those are different tests, and conflating them either floods the human queue with trivia or quietly ships a wrong action.
- **Kill-switches, tested on a schedule.** An untested kill-switch is a comment, not a control.
- **Audit logging on every decision**, including the inputs that produced it. If you can't reconstruct why an agent did something, you can't fix it — you can only apologise for it.

I published the safety pattern underneath this as an open RFC on catastrophic-action prevention ([RFC #7218](https://github.com/pavanraheja)), and the human-in-the-loop pattern separately in [Building a Guardrailed AI Agent with Human-in-the-Loop](/articles/guardrailed-agent-human-in-the-loop).

---

## 4. The evaluation ladder: 60+ in, 4 out

Every agent or strategy candidate enters a pre-registered evaluation framework. The critical word is **pre-registered**: the criteria, the thresholds and the conditions under which I stop are all written down *before* the data arrives.

This exists for one reason. Once you have results in front of you, you will find a story that justifies them. Writing the kill conditions in advance is the only defence I've found against my own motivated reasoning.

The framework is a falsification battery — a set of specific ways the idea could be proven wrong, each with a threshold committed up front. Candidates pass through walk-forward and out-of-sample validation, then shadow deployment, then supervised operation, and only then autonomy.

**The funnel to date: 60+ candidates evaluated. 4 promoted. Over 90% killed on evidence.**

That ratio is not a failure rate. It's the product working. A framework that promotes most of what enters it isn't a framework — it's a formality.

More on the method in [Evals for Agents That Act](/articles/evals-for-agents-that-act).

---

## 5. Three kills, with the arithmetic

This is the section I'd want a hiring manager to read.

### Kill 1 — Cross-venue funding arbitrage: −$18,964 across 571 pairs

The thesis was clean: funding rates on the same perpetual differ across venues, so go long on the cheapest and short on the dearest and collect the differential delta-neutral.

It ran to **571 closed paper pairs. Net −$18,964. Win rate: 0.0%.** Not a marginal loss — a structural one. **Taker fees dominated the funding differential** on every single pair. The best trade still lost money.

The honest conclusion was that the thesis is only viable as a *maker* on both legs, which is a different business requiring different infrastructure. I wrote that up and shut it down rather than tuning parameters until something looked positive.

### Kill 2 — Copy-trading: the source's edge wasn't transferable

The thesis: identify consistently profitable wallets and mirror them.

The wallets were genuinely profitable. But when I tested whether the *source* beat its own benchmark — rather than whether mirroring beat mine — the edge dissolved. Their entry prices were approximately their win rate. The profits came from **rebates, scale and speed**: structural advantages available to a market maker at size, and structurally uncapturable by a lagged taker copying them seconds later.

The lesson generalised into a rule I now apply before building any derivative product: **test whether the source beats its benchmark before assuming you can capture what it earns.**

### Kill 3 — The model that passed every offline check and was wrong by 266%

A cost model cleared every offline validation I had. In production it diverged **266%** from live reality.

Nothing in my test suite was capable of catching it, because the failure wasn't in the logic — it was in the gap between modelled and actual conditions. This is the most instructive failure I've had, and it's why **live-versus-predicted delta is now a permanent promotion gate**: nothing is promoted until its predictions have been checked against reality under load.

This is the one I bring up when someone asks what I mean by "knowing where AI gets sloppy." Plausible-and-wrong is far more dangerous than obviously broken, and offline evals systematically under-detect it.

---

## 6. The failure that changed the architecture

My worst production incident was **30 hours in which nothing errored and nothing ran.**

No alert fired, because nothing failed loudly. Every health check was green — the processes were alive; they simply weren't doing anything. Monitoring built around error rates is blind to this class of failure entirely.

The fix was to invert the assumption: **the absence of expected activity is itself an incident.** Watchdogs now track expected throughput and alert on silence, not just on errors.

I've since found the same blind spot in most systems I look at. Teams instrument what breaks and don't instrument what stops.

---

## 7. What I'd do differently

- **Instrument live-versus-predicted from day one**, not after a 266% surprise. It's cheap in advance and expensive in hindsight.
- **Write the kill conditions before the build, not before the review.** I learned to pre-register criteria after wasting weeks defending work I should have stopped.
- **Separate "uncertain" from "irreversible" earlier.** I gated on confidence first, which sent the wrong things to a human. Gating on reversibility is the better test.

---

## Why this is on a personal site rather than a company one

Glasshouse is a working system with real money behind it, so I'm careful about what I publish. Architecture, governance and failures — freely. Returns, positions and clients — never.

Everything above is inspectable. The orchestration pattern is open-sourced under MIT with a full test suite at [github.com/pavanraheja](https://github.com/pavanraheja), the safety RFC is public, and the platform itself is at [glasshousedesk.com](https://glasshousedesk.com).

If you're hiring for AI product work and want to talk about any of this — particularly the kills — I'm at [pavanraheja@gmail.com](mailto:pavanraheja@gmail.com).
