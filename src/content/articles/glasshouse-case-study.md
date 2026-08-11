---
title: "Case Study: Shipping AI Agents That Act Without a Human"
date: "2026-08-03"
excerpt: "How I decide whether an AI agent is allowed to act on its own — the evaluation gates, the three products I killed with the numbers shown, and the outage that changed how I monitor everything. Written for product people. No jargon, no returns, no hand-waving."
slug: "glasshouse-case-study"
---

Every AI product eventually runs into one question: **is this output good enough to act on without a human checking it first?**

Get it wrong in one direction and you flood a review queue with trivia nobody reads. Get it wrong in the other and you quietly ship a wrong action to a customer.

I've been answering that question weekly for two years on a system where being wrong costs me my own money. This is the case study — written for product people, not engineers. There's no financial jargon, and no performance figures, because how much the thing earned isn't the transferable part. **How it decides what's allowed to ship is.**

---

## What this demonstrates, in one table

| What I did | The product skill underneath | Where it transfers |
|---|---|---|
| Built an evaluation framework every AI candidate must pass | **Defining a quality bar for non-deterministic output** | Any AI feature where "it usually works" isn't good enough |
| Killed 90%+ of my own candidates on evidence | **Prioritisation under real constraint** — and the discipline to stop | Roadmap defence; saying no to your own ideas |
| Designed a shadow → supervised → autonomous ladder | **Staged rollout for features that can't be A/B tested safely** | Agents, automations, anything with side effects |
| Unified four incompatible external systems under one internal model | **Platform thinking** — turning per-customer bespoke work into product | Integrations, onboarding, services-to-product conversion |
| Found and fixed a class of failure my monitoring couldn't see | **Defining the right metric, not the available one** | Post-launch ownership; knowing when a dashboard is lying |

The rest of this piece is the evidence behind each row.

---

## The context, briefly

**Glasshouse** is an agent platform I designed, built and have operated alone for about two years. Its agents research opportunities, validate them, execute decisions and reconcile the results across five external systems — Binance, Bybit, Hyperliquid, Polymarket and Kalshi. Some are conventional APIs; some settle on a blockchain.

The domain is financial, but nothing below depends on understanding finance. Substitute "customer refund," "insurance claim," "collections call" or "compliance filing" and the problems are identical: an agent proposes an action with real consequences, and something has to decide whether it may proceed.

I'm the product manager, the engineer, and the person woken up when it breaks. That combination is why the failures below are documented honestly — there was nobody to hand them to.

---

## 1. The bet the whole product is built on

In 2024 most of the industry was making agents smarter. I became convinced the binding constraint was different:

> **Agents don't fail because the model is weak. They fail because nothing governs them.**

Most agent products can't answer two questions that decide whether they survive contact with production:

- *May this agent act right now?*
- *What happens when it's wrong?*

So I inverted the normal build order. I built the governance and evaluation layer **first**, and the agents second.

That was a product decision, not an engineering one — it meant shipping nothing user-visible for weeks while building the thing that decides what's allowed to ship. It's the reason the system is still running two years later.

---

## 2. Turning bespoke work into product

Each external system speaks differently — different concepts, different failure behaviour, different definitions of the same word. The obvious approach is to build a custom integration per system, and it collapses at about two.

Instead I built **one internal model** — a single shared definition of the core objects — with thin translators for each external system.

**The result:** adding a new system became *configuration* rather than a *rebuild*. Everything downstream — the risk checks, the reconciliation, the monitoring, the audit trail — was written once and works automatically on anything added afterwards.

This is the same problem as a company where every new enterprise customer takes weeks of hand-configuration by engineers. The fix isn't more engineers. It's finding the abstraction that makes the ninth customer cheaper than the first.

---

## 3. The autonomy ladder

Autonomy isn't a switch you flip. In my system it's a ladder, and nothing skips a rung:

**Shadow** — the agent runs and records what it *would* have done. Zero side effects. This is where most candidates die, safely and cheaply.

**Supervised** — the agent proposes, a human approves each action. This is where you learn what the agent gets wrong, at a survivable cost.

**Autonomous** — the agent acts inside limits agreed in advance.

Three rules hold it together:

**Draw the propose-versus-decide line explicitly.** Almost every agent incident I've seen elsewhere traces back to this line never being drawn — nobody wrote down what the agent was allowed to conclude on its own.

**Gate on *irreversible*, not on *uncertain*.** This is the distinction I'd argue hardest for. Teams instinctively route low-confidence outputs to a human. But confidence is the wrong axis: a low-confidence draft email is harmless, and a high-confidence payment is not. Route by whether you can undo it. Doing it the other way is what buries a review queue in noise while the dangerous actions sail through.

**Test the kill-switch on a schedule.** An untested kill-switch is a comment, not a control.

---

## 4. The quality bar: 60+ in, 4 out

Every candidate — every agent, every automation — passes through an evaluation framework before it's allowed anywhere near autonomy.

The critical design choice is that criteria are **pre-registered**: the thresholds, and the conditions under which I stop, are written down *before* the results exist.

That exists for one unflattering reason. Once results are in front of you, you will find a story that justifies them. Writing the kill conditions in advance is the only reliable defence I've found against my own motivated reasoning — and it's the mechanism I'd bring to any team shipping AI features.

**The funnel to date: 60+ candidates evaluated. 4 promoted. Over 90% killed on evidence.**

That ratio isn't a failure rate — it's the framework working. One that promotes most of what enters it isn't a quality bar; it's a formality.

---

## 5. Three things I killed, with the numbers

This is the section that matters most, because anyone can list what they shipped. What separates a process from a story is whether it ever produced a no.

### Kill 1 — The idea that tested beautifully and lost money every single time

**The generalisable lesson: a cost that looks like a rounding error in the model can be the entire economics in production.**

I had an idea that looked clean on paper: exploit a small pricing difference between two systems, repeatedly, at low risk.

I ran it to **571 test cases. Net −$18,964. Success rate: 0.0%.** Not marginal — structural. **The transaction fees consumed the entire margin on every single case.** The best case still lost money.

The fix wasn't parameter tuning; it was recognising the idea only works with a completely different cost structure — a different business requiring different infrastructure. I wrote that up and shut it down.

*What this looks like in a normal product org:* the feature whose unit economics are negative at every price point, and the temptation to keep tuning instead of admitting it.

### Kill 2 — The edge that existed but wasn't transferable

**The generalisable lesson: before building a product on top of someone else's success, test whether their advantage is something you can actually capture.**

The idea was to identify consistently successful actors and mirror what they did.

They *were* genuinely successful — that part checked out. But when I tested the right question — not "does mirroring work for me?" but "*why* does it work for them?" — the answer was speed, scale, and fee arrangements available only at their size. Structurally uncapturable by someone copying them seconds later.

That became a standing rule: **test whether the source beats its own benchmark before assuming you can capture what it earns.** It has since killed two other ideas before they cost me anything.

*What this looks like in a normal product org:* "our competitor does X and it works, so we should do X" — without asking which of their structural advantages made X work.

### Kill 3 — The model that passed every test and was wrong by 266%

**The generalisable lesson: offline evaluation systematically under-detects the most dangerous failure mode, which is plausible-and-wrong.**

A model cleared every offline check I had. In production it was off by **266%**.

Nothing in my test suite could have caught it, because the failure wasn't in the logic — it was in the gap between modelled conditions and real ones. Everything was internally consistent and externally wrong.

**So live-versus-predicted comparison became a permanent gate.** Nothing is promoted until its predictions have been checked against reality under load, on a small real sample.

This is what I mean when I say I know where AI gets sloppy. Obviously-broken output is easy — someone reports it. Plausible-and-wrong output ships, gets trusted, and is found much later by a customer.

---

## 6. The outage that changed how I monitor everything

My worst incident was **30 hours in which nothing errored and nothing ran.**

No alert fired, because nothing failed loudly. Every health check was green. The processes were alive — they simply weren't doing anything. Monitoring built around error rates is completely blind to this.

The fix was to invert the assumption: **the absence of expected activity is itself an incident.** Alert on silence, not just on errors.

I've since found the same blind spot in most systems I look at. Teams instrument what breaks, and don't instrument what stops. It's a metrics-definition problem wearing an engineering costume — which is exactly the kind of thing a product owner should catch.

---

## 7. What I'd do differently

- **Instrument live-versus-predicted from day one**, rather than after a 266% surprise. Cheap in advance, expensive in hindsight.
- **Write the kill conditions before the build, not before the review.** I lost weeks defending work I should have stopped, because I hadn't agreed in advance what "stop" looked like.
- **Separate irreversible from uncertain earlier.** I gated on confidence first and sent the wrong things to a human.

---

## Everything here is inspectable

None of this is a framework I read about. It's the habit of deciding — repeatedly, with consequences — what an AI system is allowed to do on its own, and being willing to kill your own work when the evidence says so. That habit is cheap to describe and expensive to acquire.

The orchestration pattern is open-sourced with a full test suite at [github.com/pavanraheja](https://github.com/pavanraheja), the safety design is published as an open RFC, and the deeper technical write-ups are here: [the seven-layer architecture](/articles/architecture-of-a-self-driving-system), [evaluation gates in detail](/articles/evals-for-agents-that-act), and [the human-in-the-loop pattern](/articles/guardrailed-agent-human-in-the-loop). The platform itself is at [glasshousedesk.com](https://glasshousedesk.com).

Deliberately not included: returns, client names, pricing. The engineering and the judgement are the transferable parts.

I'm at [pavanraheja@gmail.com](mailto:pavanraheja@gmail.com) — particularly happy to talk about the kills.
