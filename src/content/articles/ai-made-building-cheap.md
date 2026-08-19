---
title: "AI Made Building Cheap. Being Wrong Is Still Expensive."
date: "2026-08-17"
excerpt: "Shreyas Doshi is right: AI won't save you from building the wrong thing. I have the graveyard to prove it — a year of systems my agents built fast and correctly that one cheap test would have killed before any code. Here's the test, and where judgment actually comes from."
slug: "ai-made-building-cheap"
---

Shreyas Doshi posted a line this week that I felt personally: "AI won't save you from building the wrong thing."

I can confirm. I have the graveyard.

## A year of building at AI speed

For the past year I've run a portfolio of autonomous agent systems that make live decisions with real money at stake. Agents pull the data, write the analysis, build the system, validate it, deploy it, and monitor it. Work that used to take me weeks now takes an afternoon. Building became nearly free.

Here's what nearly-free building bought me:

**A system to copy top performers in a public marketplace.** The agents built it beautifully — tracking, mirroring, reconciliation. Months of iteration. Then I finally ran the one analysis that mattered: the "experts" had no copyable edge. Their profits came from structural advantages — scale, speed, fee rebates — none of which a follower inherits. The system worked perfectly. The thing it did was worthless.

**A second copy-system on a different venue, with better data.** Same story at larger scale: I analyzed 118,000+ decisions across 630 top performers. The copyable edge, measured properly, was smaller than the cost of capturing it — negative at any scale, even assuming perfect execution. I'd built weeks of infrastructure to harvest an edge that was thinner than the harvesting fee.

**An arbitrage scanner across three venues.** It monitored 571 opportunities and simulated thousands of decisions, flawlessly. Win rate: zero percent. The spread it was built to capture was consistently smaller than the cost of the round trip. The scanner was excellent. The opportunity didn't exist.

**A strategy that looked like a clear winner in testing.** Re-validated across three years of data instead of the window where I'd discovered it: the edge evaporated. It wasn't a signal; it was a coincidence I'd found and then confirmed on the same data that produced it.

None of these failed because the AI built them badly. The AI built them *fast and correctly*. That's the trap: when building is cheap, you build first and ask questions later — and the questions were always the whole game.

## The 20-minute test that replaced months of building

The expensive lesson, condensed into one rule I now apply before any build:

**Prove the thing exists before you build the machine that harvests it.**

For the copy-systems, that proof was one query, about 20 minutes: do the sources actually beat the benchmark, and is their edge bigger than the cost of following them? Run first, that query would have killed both projects in an afternoon instead of consuming months.

This is now structural, not aspirational. Every candidate system goes through a falsification battery before it touches anything real — over the past year I've tested 60+ candidates and promoted 4. A kill rate above 90% used to feel like failure. It's actually the system working: the kills now happen at the cheap end of the funnel, before the build, not after.

## What this means if you build products

The uncomfortable version for product people: AI is coming for delivery, not discovery. Writing the spec, shipping the feature, wiring the integration — agents do more of that every month. What they don't do is tell you the feature shouldn't exist. Every failed system in my graveyard had a moment, before any code, where one cheap test would have killed it. I skipped the test because building felt like progress.

So my operating rule now, for autonomous systems and products alike:

1. **Name the assumption the whole thing depends on.** (The experts have edge. Users want this. The gap exceeds the cost.)
2. **Find the cheapest possible test of that assumption.** Usually a query, a spreadsheet, or ten customer conversations — not a build.
3. **Run it before the agents touch a keyboard.** The build is now the cheap part. Spend your judgment where it's still scarce.

## Where judgment comes from

Hiten Shah made the adjacent point recently: in 2026 you're no longer limited by your technical skills — everyone has the same stack now. What limits you is your ability to judge which problems are worth solving. Judgment is the moat. And it doesn't come from tutorials.

He's right about the last part in a way I had to learn expensively. Judgment comes from shipping real things, watching them meet reality, and being honest about what happened. Which means my graveyard isn't the embarrassing part of this story — it's the curriculum. Every dead system taught me a specific failure mode: edges that belong to someone else's structure, spreads thinner than their cost, patterns that only exist in the window you found them in. The 20-minute test isn't cleverness; it's four post-mortems compressed into a checklist.

That's also why the moat is real. Anyone can copy my stack this afternoon — the agents, the pipelines, the tools are commoditized. What they can't copy is the list of ways I've watched good builds die, because that list only comes from paying for it.

AI won't save you from building the wrong thing. But it will happily help you build the wrong thing faster, more elegantly, and with better test coverage than ever before.

The skill that's left is deciding what deserves to exist. And the only way to get better at it is to build, be wrong in public, and keep the receipts.

---

*More on how I run these systems — the promotion ladders, falsification batteries, and guardrails — in the [Playbooks on /work](/work).*
