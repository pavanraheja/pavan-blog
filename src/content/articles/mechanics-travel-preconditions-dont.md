---
title: "Mechanics Travel. Preconditions Don't."
date: "2026-08-16"
excerpt: "I once improved a mechanic's first step by 30% and the loop still didn't close. Here's what that taught me about borrowing what works elsewhere — and why it matters more now that building is nearly free."
image: "/images/mechanics-travel-preconditions-dont.png"
slug: "mechanics-travel-preconditions-dont"
---

In 2020 I worked on growth for the Google Web Stories plugin for WordPress. My piece of it was template discovery — helping people find a starting point instead of staring at an empty canvas. It worked. Template discovery went up about 30% in three months.

The loop still didn't close.

I've thought about that for years without having language for it. I do now, and it's this: **a mechanic that works somewhere else arrives at your product without the conditions that made it work.** You can execute your part perfectly and still get nothing, because the thing you borrowed was never really the feature.

This matters more than it used to. When building was expensive, you borrowed carefully — you only got two or three shots a year. Now an agent can prototype your idea before lunch, which means you'll borrow constantly, and the failure rate goes up rather than down.

## A mechanic is not a feature

Stories is the example everyone reaches for, so let's take it apart properly.

The visible feature is: a photo or video that disappears after 24 hours.

The mechanic is six steps:

1. Lower the pressure to create — it's gone tomorrow, so it doesn't have to be good
2. Which makes people more willing to share
3. Make consuming those updates effortless — tap, tap, tap
4. Show the creator exactly who watched
5. Give the viewer a frictionless way to reply
6. Which creates another reason to share again

That's a behavioural system, not a format. Each step feeds the next. Step four is doing enormous work — the viewer list is the payoff that justifies step one. Take it away and you've got a slideshow.

Most teams copy step one and the visual language, then wonder why nothing compounds. **Decompose to the loop or you're cargo-culting the artifact.**

## Where transplants actually die

Now put that loop into WordPress.

Step one, I can help with. Templates lower the pressure to create — that's exactly what my part of the work was, and it moved.

Step two follows, a bit. Some publishers made Stories.

Step three is fine. They render well.

Step four is where it stops. **A WordPress publisher doesn't have an ambient audience.** They publish to search traffic — to strangers arriving from a query, days or months later, who will never be presented as a list of names to the person who made the thing. There's no "who saw mine." There's an analytics dashboard, which is not the same organ at all.

And without step four, step six never fires. No payoff, no reason to make another one tomorrow.

The format travelled. The loop didn't.

I want to be precise about my own part in this: I wasn't the architect of that plugin and I wasn't there long. I worked on one step, and that step improved. The lesson isn't that I failed — it's more uncomfortable and more useful than that. **You can win your step and still not get the loop**, because loops aren't the sum of their steps. They're conditional on each other, and on things outside the product entirely.

Instagram had an ambient audience before Stories existed. Snapchat had a social graph built on ephemerality. Those weren't features anyone shipped alongside the mechanic. They were **preconditions** — already true, invisible, and doing half the work.

## The mechanic I did carry

Here's the part I only saw recently, looking back across fifteen years.

Almost everything I've built is a version of the same question: **how does a system earn the right to act without asking?**

- **PriceLabs** — vacation-rental revenue management. The behaviour that compounds is the host trusting the algorithm enough to stop overriding the price.
- **Mashkor** — a marketplace. Each successful delivery making the next order feel safer to place.
- **Nova Benefits** — HR tech. HR feeling safe enough to recommend it; employees safe enough to actually use it.
- **Insight Bay** — AI agents for small businesses. A business owner letting an agent speak to his own customers, in his own voice, while he's asleep.
- **Glasshouse** — my agentic platform. Me letting an agent act with real money and nobody watching.

Different categories, different decades, same problem. PriceLabs and Glasshouse are the *identical* product question with different stakes: a host deciding whether to accept an algorithmic price, and an operator deciding whether an agent can act unattended. Both are trust delegation.

The mechanic that came out of that, and the one I'd hand to anyone else:

**Shadow, then supervised, then autonomous — with permission gated on whether an action can be undone, not on how confident the model is.**

Shadow means the system records what it *would* have done and touches nothing. Supervised means it proposes and a human approves, which is where you learn cheaply what it gets wrong. Autonomous means it acts inside agreed limits.

And the gate is the part most teams get backwards. The instinct is to escalate low-confidence output to a human. That's the wrong axis. A low-confidence draft is harmless — you read it, you fix it, you move on. A high-confidence irreversible action is not: the payment is sent, the booking is cancelled, the message is in your customer's inbox with your name on it. Route by confidence and you bury your reviewers in trivia while the consequential actions sail through, precisely because the model happened to be sure.

## And this mechanic has preconditions too

I'd be doing exactly what I'm warning against if I didn't say this.

The autonomy ladder needs **actions that are cheap to reverse**, at least at the lower rungs. It needs a supervised phase where being wrong is survivable, because that phase is how the system earns the next rung. Where nothing can be undone — where the first action is already the irreversible one — the ladder doesn't work and you need a different design entirely: constrained action spaces, mandatory human authorship, or simply not automating that step.

It also needs someone with the authority to say no when the numbers look good but the rung wasn't earned. That's an organisational precondition, not a technical one, and it's the one most likely to be missing.

## Why this is about to be everyone's problem

For most of software history the product question was *is this useful?*

When software acts on your behalf, and doesn't do the same thing twice, the question quietly changes to *do I let it?*

That substitution has already happened in a lot of products and I don't think many teams have noticed. Every product that adds an agent inherits a trust problem it didn't have before — and trust delegation is not a feature you ship, it's a loop you have to run.

Which means the thing I've been building since 2020 without a name for it stops being a specialist concern.

## The thing that actually gets scarce

Hiten Shah wrote recently that as building gets cheap, we're about to get extremely good at building bad ideas quickly. I think that's right, and I'd push it one step further.

Every serious mistake I've made with AI was a **verification** failure, not a creation failure.

A model of mine passed every offline evaluation I had and was 266% wrong against live data. An outage ran for thirty hours in which nothing errored and nothing ran — every health check green, because the monitoring watched for errors rather than for the absence of expected activity. A backtest showed a 6.94 profit factor and collapsed to 1.02 when I found the look-ahead bias in my own harness: the system was reading information from its own near future, and no robustness test I owned could see it, because they all assumed the data pipeline was honest.

None of those were hard to build. All of them were hard to disbelieve.

That's the shape of the problem now. Non-deterministic systems fail quietly, plausibly, and confidently. They don't throw errors — they produce something that looks right. So when creation costs nothing, **the bottleneck moves to being able to tell whether the thing is real.**

## On taste, honestly

The obvious conclusion is that judgment and taste matter more. I believe that, and I'd add the uncomfortable half.

Taste also gets more dangerous. Engineering scarcity used to be an accidental cooling-off period: you had an instinct, and three weeks of build time in which to notice it was wrong. That delay is gone. Every instinct ships now.

I don't think the answer is a hard metric gate on everything. It would have killed Stories. Early signal on genuinely new behaviour is almost always ambiguous, and conviction is what carries a good idea through the ugly middle where the numbers say nothing yet.

The answer is smaller and duller. Before you build, write down **what you would expect to see if you were right** — and what would make you drop it. Not a number. An expectation, recorded before you're emotionally invested in the answer. It costs ten minutes and it's the only defence I've found against the thing that actually gets you, which is finding a story afterwards that justifies whatever you got.

## What I'd actually do with this

Three things, and none of them are complicated.

**Name the behaviour your product compounds on.** Not your metric — the behaviour. Meta compounds on attention. A marketplace compounds on each transaction making the next one easier to trust. An agent product compounds on people delegating more important work over time. If you can't name it in a sentence, every mechanic you borrow is a guess.

**Before borrowing a mechanic, write down what it needed where it worked.** Not what it did — what had to already be true. Stories needed an ambient audience. Referral loops need something worth telling someone about. My autonomy ladder needs actions cheap enough to undo. Then check, honestly, whether you have those things. If you don't, you're not importing a mechanic, you're importing a shape.

**Instrument the absence of things, not just the failure of things.** The dangerous failure is silence — the loop that quietly stopped firing while every dashboard stayed green.

I improved template discovery by 30% and the loop still didn't close. That's not a story about a bad mechanic or a bad team. It's a story about borrowing something excellent and not asking what it was standing on.

Building is about to get very cheap. Asking that question is about to get very valuable.
