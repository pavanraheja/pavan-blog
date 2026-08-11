---
title: "Risk Guardian: Preventing Catastrophic Actions in Long-Running AI Agents"
date: "2026-06-30"
excerpt: "An evaluator that catches a bad output after the fact is sometimes too late — you can't un-send a webhook or un-drain a budget. RFC #7218 proposes the missing layer: a deterministic, pre-action safety gate for autonomous agents. Here's the design."
image: "/images/risk-guardian-rfc-7218.png"
slug: "risk-guardian-rfc-7218"
---

Most agent frameworks have a way to judge an action *after* it happens — an evaluator node that looks at the output and decides RETRY or ACCEPT. That's necessary, and for a whole class of work it's enough.

It is not enough when the action touches the real world. You cannot un-send a webhook. You cannot un-drain an API budget. You cannot un-issue a duplicate order. For that class of failure, an evaluator catching the mistake after the fact is just a well-documented post-mortem.

So I filed **[RFC #7218 — "Risk Guardian: a production safety harness for catastrophic-action prevention in long-running agent loops"](https://github.com/aden-hive/hive/issues/7218)** on [Aden HQ's open-source Hive](https://github.com/aden-hive/hive) (a multi-agent harness for production AI). It proposes the layer that most harnesses are missing: a **deterministic, pre-action gate**. This is the design, drawn from a smaller reference implementation I maintain ([`alphagrid-orchestrator`](https://github.com/pavanraheja/alphagrid-orchestrator), MIT), extracted from a multi-strategy live execution system I operate.

## The failures you can't afford even once

Post-action evaluation assumes the action is reversible or cheap. These aren't:

- An agent with browser/tool access issuing a **destructive request** — a DELETE, or a POST to a payments endpoint.
- A worker **draining a budget** — LLM tokens, API quota, on-chain gas — because a loop never terminated.
- A **retry storm** against a rate-limited or paid API: compounding cost plus a lockout.
- **Two workers issuing conflicting writes** to the same external system: duplicate orders, double-posts.
- A previously-validated agent that quietly **drifts** and starts producing actions outside its acceptance envelope.

The common thread: by the time an evaluator sees the output, the side-effect has already fired. You need something that can say "no" *before*.

## Where the guard sits

Risk Guardian is a layer between the action-issuing node and the actual side-effecting tool. Every guarded action passes through a deterministic chain before it's allowed to touch an external system.

```text
   ┌─────────────┐     proposes action      ┌──────────────────────────┐
   │  Agent /    │ ───────────────────────▶ │      RISK GUARDIAN        │
   │  Worker     │                          │   (pre-action gate)       │
   └─────────────┘                          │                          │
                                            │  kill switch?      ──┐    │
                                            │  budget cap?         │    │
                                            │  duplicate/conflict? ├─ ALL must pass
                                            │  policy allow-list?  │    │
                                            │  drift envelope?   ──┘    │
                                            └───────┬───────────┬──────┘
                                              pass  │           │  fail
                                                    ▼           ▼
                                          ┌────────────────┐  ┌────────────────────┐
                                          │  Execute the   │  │  Block + structured │
                                          │  side-effect   │  │  failure record     │
                                          └────────────────┘  └─────────┬──────────┘
                                                                         │
                                                              feeds the failure-learning loop
```

A failure here isn't a silent drop — it emits a **structured failure record**, which is exactly the input a failure-learning loop wants.

## The six mechanisms

Each is small, independently toggleable, and — importantly — **deterministic**. No LLM call sits in the guard path.

1. **Budget caps.** Per-loop and per-session limits on token spend, tool-call count, and external-API cost. The counter increments *before* the call; a breach is a hard halt, not a warning.
2. **Conflict / duplicate guards.** A content-hash + target-resource fingerprint of each side-effecting action. An identical fingerprint inside a configurable window is blocked — this is what kills retry storms and the "two workers, same write" race.
3. **Two-stage dispatcher.** For anything flagged expensive or destructive, the agent emits an *intent* first; a separate confirmation — a human, or an automated policy check — must clear before the action fires. This is the natural seam for human-in-the-loop.
4. **Drift / acceptance-envelope monitor.** A rolling-window quality metric per agent. If it drops below a threshold (e.g. the evaluator's RETRY rate exceeds X over the last N runs), the loop pauses for review. The "this agent has drifted" detector.
5. **Kill switch.** A single flag that halts every loop in one colony. The tested invariant: kill-switch-on at the top of any worker iteration = an immediate, clean exit with a structured terminal state. This one must be exercised in CI — a kill switch you've never fired is a kill switch you don't have.
6. **Allow-list / deny-list.** A static policy restricting which tool calls each agent may issue — e.g. read-only for a newly-deployed agent, write access unlocked only after it earns promotion.

## Why this is a *separate* layer

The objection I expected was "doesn't the evaluator already do this?" No — and the reason is the whole argument for the RFC. These layers answer different questions at different times:

| Layer | Question it answers | Timing |
|---|---|---|
| System prompt / planning | What *should* the agent do? | Pre-loop |
| Evaluator / Judge | Was the output good? | Post-action |
| Failure-learning loop | Have we seen this failure before? | Pre-loop + post-action |
| **Risk Guardian** | **Is this specific action safe to issue *right now*?** | **Pre-action** |
| Retry | Did the action transiently fail? | Post-action |

Risk Guardian is the only layer that says "no" *before* the side-effect, and it does so on grounds that have nothing to do with output quality — cost, idempotency, drift, and external-system invariants. Those are not things you want an LLM adjudicating in the hot path; they're things you want a deterministic gate enforcing.

## Design principles

The whole point is to be the boring, trustworthy part of the stack:

- **Composable** — every mechanism toggles independently.
- **Deterministic** — no model call in the guard path, so the gate's behavior is reproducible and auditable.
- **Off in dev, on in prod** — guards engage when an integration is marked production; paper and dev runs stay frictionless.
- **Testable in CI** — the kill-switch and budget invariants ship with integration tests. Safety you don't test isn't safety.

## The throughline

This is the same idea I keep coming back to: in an agent that acts, [the guardrail is the feature](/articles/production-ai-agents-reliability), and [the safe default is to ask a human](/articles/guardrailed-agent-human-in-the-loop). Risk Guardian is what that looks like one level down — at the harness, as a deterministic pre-action gate, with the kill switch built and tested *before* the clever part.

Intelligence is increasingly something you can buy from a model provider. The gate that decides whether an autonomous loop is allowed to touch real systems is the part you have to build, and own. RFC #7218 is one proposal for what that should look like.
