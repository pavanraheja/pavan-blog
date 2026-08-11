---
title: "Evals for Agents That Act"
date: "2026-07-13"
excerpt: "Grading a chatbot's answer is one problem. Deciding whether to let an agent touch production is a different one. You don't score the output — you grant authority, in stages, behind gates that it has to earn."
image: "/images/evals-for-agents-that-act.png"
slug: "evals-for-agents-that-act"
---

An eval for a chatbot grades prose: was the answer correct, helpful, on-policy? You can run it offline, on a golden dataset, and read a number off the end.

An eval for an agent that *acts* is a different problem, because you're not grading an answer — you're deciding whether to let the thing touch production. The output isn't a sentence; it's a side-effect. And the question isn't "is this good?" but "is this allowed to happen for real, yet?"

The shape that's worked for me isn't a score. It's a **ladder with gates.** An agent earns the right to act by passing through stages, and each stage has an acceptance gate it has to clear before it's promoted to the next.

## The promotion ladder

```text
   SHADOW              PAPER                LIVE (gated)
   logs decisions      runs the full loop   real actions, min size
   executes nothing    against a mock       Risk Guardian ON
        │                   │                    │
     ┌──┴──┐             ┌──┴──┐              ┌──┴──┐
     │GATE │             │GATE │              │GATE │
     │clears│            │behaves under│      │real metrics │
     │held- │            │realistic    │      │match paper  │
     │out?  │            │flow?        │      │within tol?  │
     └──┬──┘             └──┬──┘              └──┬──┘
        │ promote           │ promote            │ promote
        └─────────▶─────────┴─────────▶──────────┘
                    else: fix / kill
```

**Shadow.** The agent runs on real inputs, makes real decisions, logs all of them — and executes *nothing*. You compare its decisions against ground truth or against what a trusted process actually did. The gate: does it clear a defined threshold on held-out cases? Shadow is cheap and catches the embarrassing failures before they cost anything.

**Paper.** The agent runs the *full* loop — planning, tool calls, the works — against a mock adapter that simulates side-effects instead of committing them. This is where you find the integration bugs: the retry that storms, the loop that doesn't terminate, the edge case the shadow inputs never hit. The gate: does it behave under a realistic flow, with metrics holding and no crashes?

**Live, gated.** Real actions, smallest possible size, with [Risk Guardian](/articles/risk-guardian-rfc-7218) on and the kill switch armed. The gate here is the one that actually matters: **do the real-world metrics match what paper predicted, within tolerance?**

## Falsification, not confirmation

The trap in evaluating an agent is asking "does it pass?" — because you'll find cases where it does and feel reassured. The more useful question is the scientist's: **what would prove this wrong?**

So the gate at each stage isn't a happy-path checklist; it's a falsification battery — a suite of held-out, adversarial cases designed to *break* the agent. Stale data. Conflicting signals. The input that looks like the training distribution but isn't. Promotion is blocked unless the agent survives the battery, not merely passes a demo. An agent that clears ten cherry-picked examples and dies on the eleventh adversarial one hasn't earned anything.

Around the ladder runs a simple cadence: every batch of decisions gets a **keep / fix / kill** review on its real failures. Not a dashboard you glance at — a decision you make, on the cases that went wrong, on a schedule.

## Why the last gate is always live

Here's the part that the offline-eval mindset misses: [the environment your agent was evaluated in is never the environment it runs in](/articles/production-ai-agents-reliability). I once had a strategy whose cost model was off by 266% — flawless in simulation, gone in production, entirely inside the gap between the two.

That's why the final gate can never be a sandbox score. No matter how good shadow and paper look, the last promotion is always a small, *real* test, instrumented to compare live behavior against the paper prediction. The delta between them is the single most important number in the whole eval — it's the measure of how much your simulation was lying to you.

## The takeaway

Evals for agents that act aren't a leaderboard. They're a mechanism for **granting authority incrementally**: shadow earns the right to be taken seriously, paper earns the right to run the full loop, live-at-min-size earns the right to scale. You don't grade the output and ship. You make the agent climb, and you put a gate on every rung — falsification on the way up, kill switch on the way down.

The number at the end of a chatbot eval tells you how good the answer was. The ladder tells you something more useful for anything that acts: how much you're allowed to trust it, today.
