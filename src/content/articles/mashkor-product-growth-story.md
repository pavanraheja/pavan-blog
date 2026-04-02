---
title: "How We Scaled Mashkor: A Product & Growth Story"
date: "2024-06-15"
excerpt: "From 250 orders a day to 3.5x users and 2.8x revenue in 18 months. Here's the full playbook — discovery, ops, acquisition, and AI/ML — from inside the building."
image: "/images/mashkor-hero.webp"
slug: "mashkor-product-growth-story"
---

Rarely do I share the details behind what actually happened at Mashkor. But enough people have asked that I figured it's time to write it down properly.

Mashkor is a hyperlocal app in Kuwait. Two core services: "buy anything" and "pick up anything." Users request drivers to purchase items or deliver from one location to another. Think of it as a personal concierge on your phone — powered by a fleet of drivers across Kuwait City.

When I joined, the business was flat. Around 250 orders per day. The goal was to scale it significantly — and fast.

Here's exactly how we did it.

---

## Who We Were Building For

Before touching any code or running any campaigns, we needed to understand who was actually using this product. Two personas emerged clearly:

**The Kuwaiti Housewife** — uses Mashkor as a modern replacement for a house driver. High frequency, high trust, very sticky once converted.

**The Busy Working Professional** — no time for outdoor errands. Uses the app for convenience. More transactional, but high volume.

These two personas shaped every decision that followed.

---

## Phase 1 — Fix the Leaky Bucket First

**Target:** Scale from 250 to 1,000 orders/day within 18 months.

The instinct in most companies is to pour fuel on acquisition. We didn't. Growth into a broken product just accelerates churn.

We ran qualitative interviews and quantitative surveys across two segments: first-time users (signed up but never ordered) and existing users (active but flagging).

**What we found:**

- New users: the value proposition was unclear on the homepage. Usability issues blocked conversion.
- Existing users: pickup times averaged 55 minutes. That's the product failing, not the marketing.

**Decision:** Fix existing users first. Stop the bleed before you open the tap.

### What We Built

**Operations layer:**
- Built dashboards and a prediction system to forecast order volumes by time and location
- Increased driver count, improved driver quality scoring based on customer feedback
- Target: reduce pickup times from 55 → 30 minutes
- Established OKRs around customer satisfaction — not just orders
- Proactive delay communication + partial refunds for significant delays

**Product revamp — every step of the journey:**

| Touchpoint | Change |
|------------|--------|
| Onboarding | Visual education of what the app can do |
| Sign-up | Added WhatsApp + Google sign-on, OTP via WhatsApp |
| Homepage | Google Maps search bar for easier place discovery |
| Order page | Improved address accuracy (learned from local players) |
| Cart | Contextual prompts to guide users |
| Checkout | Integrated Apple Pay |
| Re-order | Added one-tap reorder directly from homepage |

**Results after Phase 1:**
- Pickup times reduced to 30 minutes within 2 months
- Conversion rate: **19% → 32%** in ~5 months
- App ratings and satisfaction scores improved significantly

---

## Phase 2 — Grow the Top of Funnel

With the product stable, we turned to acquisition.

### Attribution + Analytics First

We implemented **Adjust** and **MoEngage** before spending heavily on paid channels. You can't scale what you can't measure. Attribution had to be airtight.

### Channel Experimentation

We tested everything: Google, TikTok, Instagram, Apple Search Ads.

**Findings:**
- Google and TikTok → clear attribution, reliable CAC data → doubled down
- Apple and Instagram → partial traction → increased by 30% and kept optimising
- Social content (contests, memes) → drove link clicks and converted surprisingly well
- Word of mouth → maintaining strict SLAs created genuine delight → customers spread it

### Hypothesis-Driven Growth at Every Touchpoint

We ran experiments across the entire funnel — not just top-of-funnel ads:

- **Onboarding:** Multiple flows tested to educate users effectively on first open
- **Sign-up:** Reduced friction, tested every method, optimised for completion rate
- **Non-transactional users:** Targeted campaigns for users who signed up but never ordered
- **WAU (Weekly Active Users):** Personalised offers based on time of day, busy vs quiet days, trending locations
- **Churned users — voluntary:** Personalised re-engagement with offers + surveys to understand the why
- **Churned users — involuntary:** Fixed technical failures (crashes, payment issues) + improved support response times

**Results after Phase 2:**
- User base grew **2.5× in a short window**
- Continued scaling investment into the top-performing channels

---

## Phase 3 — AI/ML to Deepen Engagement

With users growing, the next lever was basket size and engagement depth.

**Objective:** Increase basket size by 20% through personalisation.

### User Segmentation

We split users into three tiers:
- **Casual** — 1 order
- **Core** — 2 to 4 orders
- **Power** — 5+ orders

We studied power user behaviour obsessively. What did they order? When? Which categories? What made them come back?

### What We Built

- Built a categories section based on power user insights
- Implemented **Google Vertex AI** for personalised recommendations
- Focused on habit-forming, popular places — served at the right moment in the session
- Batch recommendations first, moving toward real-time as data matured

![Mashkor Daily Active Users and 30-Day Active Users — Jul 2023 to Apr 2024](/mashkor-growth-chart.png)

*The chart shows what compounding looks like in practice. 30-day active users (pink) grew steadily and consistently. Daily active users (blue) followed the trend upward with clear acceleration from Jan 2024 onward.*

**Results:**
- CTRs increased significantly from personalised recommendations
- Average basket size improved by **7%**
- Overall engagement up **15% within 50 days**
- User count reached **3.5×**
- Revenue reached **2.8×**

---

## The Team Behind It

None of this happens alone. I led a product team of 2 PMs and 1 designer. Engineering was 1 EM and 10 engineers. We worked tightly with marketing, legal, finance, and sales — alignment across functions is what made the execution clean.

---

## What I'd Take From This

A few things I'd tell anyone scaling a consumer app:

**→ Fix before you grow.** Pouring acquisition budget into a broken product is expensive in every sense. Conversion rate improvements compound faster than any paid channel.

**→ Attribution before spend.** We ran the analytics setup before the campaigns. Most teams do it the other way and waste months of data.

**→ Segment your users — then study the best ones.** Power users are your product manual. They're already doing what you want everyone to do. Understand them deeply.

**→ AI/ML isn't magic — it's iteration.** Vertex AI didn't work on day one. Batch recommendations came first. Real-time came later. The technology serves the hypothesis, not the other way around.

**→ SLAs are a growth lever.** Reducing pickup times from 55 to 30 minutes drove word-of-mouth we couldn't have bought. Operational excellence is a marketing strategy.

The 18-month journey from 250 orders/day to 3.5× users and 2.8× revenue wasn't one big move — it was a hundred small ones executed in the right sequence.

That's the game.
