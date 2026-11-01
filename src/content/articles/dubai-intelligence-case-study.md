---
title: "Case Study: Building an AI That Knows When to Say \"I Don't Know\""
date: "2026-11-01"
excerpt: "Dubai Intelligence answers property questions from real government sales data, refuses what the data can't support, and gets better from every real question with a person approving each change. How I built it with AI, how I measured it honestly, and what real users broke."
slug: "dubai-intelligence-case-study"
---

Most AI tools that answer questions about data have the same flaw: they always answer. Ask where prices are heading and you get a number. Ask whether to buy and you get advice. The answer sounds confident whether or not the data behind it can support it.

I wanted to see whether an AI product could do the opposite: answer property questions from real data, and be just as clear about what it **can't** tell you. The result is **Dubai Intelligence**, a question-and-answer tool and decision workbench over real Dubai Land Department sales.

- Live: [dubai-re-intelligence-seven.vercel.app](https://dubai-re-intelligence-seven.vercel.app)
- Code and product brief: [github.com/pavanraheja/dubai-re-intelligence](https://github.com/pavanraheja/dubai-re-intelligence)

I built it on my own, driving Claude Code. This is how it works, how I measured it, and what broke.

## The real problem

The obvious request for a tool like this is "a dashboard for all of Dubai". The real problem is different. Property decisions get made on numbers nobody in the room can trace: a forecast dressed as a fact, a price gap that is really a difference in product mix, an answer about the wrong area.

The shortage is never data. It's the confident number that shouldn't exist. So the product is narrow on purpose: a small number of communities, every number carrying its basis, and explicit refusals where the data can't support the question.

## The rules it can't break

I wrote down an evidence contract before building, and the code enforces it:

1. **Words can be generated; numbers can't.** A model may choose which tool runs, but every number comes from a calculation over real sales. A test fails if any number in an answer isn't in the engine's output.
2. **Refusals are checked before anything is computed**, and each says why. "Where are prices heading?" is refused, because sales records contain no forward data. "Why did prices rise?" is refused, because transactions show association, not cause. "Should I buy?" is refused, because that's the buyer's judgement.
3. **Fewer than 30 sales means no answer**, not a low-confidence one.
4. **Every answer states its row count, date window, source and pull date.**
5. **Two communities are never pooled into one number.** I added this rule after a real user found the bug (below).

## How AI took part at each stage

- **Research:** I used Claude to find out what data actually existed. The most important finding was a limitation: the public feed only serves the current calendar year. So the tool says plainly that it can't answer year-on-year questions, rather than estimating them.
- **Building:** Claude Code wrote most of the data pipeline, the engine and the interface. My part was the judgement it couldn't supply. "Emaar South", for example, isn't an official registry area, so I defined which projects belong to it. The exclusion report then caught two projects worth 348 sales that would otherwise have been a 30% undercount.
- **Testing:** I didn't let the same AI mark its own work. A separate model wrote an evaluation set from the tool's description only, without seeing the code.
- **Improving:** an agent reads real usage and proposes new tests. I approve every one.

## Measuring it honestly

The first baseline was poor, and I kept it on record: **58% on the development set and 52% on a holdout, with 21 questions answered that should have been refused.**

After fixing the refusal logic, the independent evaluation set scored **34 out of 40 on first contact**. It found a real bug: the word "rent" matched inside "cu**rrent**", so some price questions were being treated as rent questions.

It now scores 40/40 on that set, but I don't quote that number. Once you've tuned against a test set, it no longer measures anything honestly. The 34 is the real first-contact score; a fresh clean number needs a new independent set.

## What real users broke

Evaluation sets only test what you thought to ask. Real users found what I didn't:

- **The first hand-typed question**, "what is going on with Dubai creek harbor", got a generic two-community table, and the deliberate refusals read as failures. Lesson: a wrong view *feels* like a refusal to the user. I added a single-community snapshot, and every refusal now offers questions the data *can* answer.
- **"Price trend in both"** returned one blended line, −1.6%, marked HIGH confidence. In reality the two communities moved in *opposite* directions: Creek Harbour −2.1% and Emaar South +2.2%. The blended number described neither place. That's the exact mistake the product exists to prevent, and it got through. It's now fixed, permanently tested, and the reason for the "never pool" rule.
- **A presentation miss:** with both communities on one chart, Emaar South's +2.2% flattened into a straight line under Creek Harbour's scale. The routing was right; the chart was wrong. Each community now gets its own chart.

## A learning loop with a human gate

Both bugs were found by someone noticing a rephrase, so I built an agent to do that systematically. Every live question is logged, with no IP or identifying data. The agent replays each question on today's code, flags rephrase chains (someone asking again within two minutes using some of the same words), counts refusals as demand for data the product lacks, and proposes new test cases.

It never changes a rule or a label on its own. That's on purpose, and its first live catch showed why. Someone asked "how many studios sold in Creek Harbour recently". The tool listed recent deals instead, and the agent proposed that list as the correct answer, which was the bug itself. Auto-accepting it would have written the mistake into the test set as correct. I corrected it: the answer is zero.

I later went further and checked that zero against the raw registry data with no filters. Across three months, those communities had about 600 sales and not one studio, while thousands of studios sold elsewhere in Dubai in the same months. So the source records studios; these communities just don't sell them. "Zero in a well-covered area" is an answer. "Zero because there's little data" is a refusal.

## From answering questions to supporting a decision

Answering questions isn't the end goal; making a decision is. The [decision workbench](https://dubai-re-intelligence-seven.vercel.app/decide) frames one: a budget to deploy in Dubai South, at a given ticket size. Which projects, and why?

**The tool never picks.** The person sets the criteria and how much each matters. The tool ranks every project with 30+ sales across 13,000+ real transactions, then stress-tests the ranking across 2,000 plausible weightings to show how settled it really is, and lists what the data can't tell you.

The data taught me things before any ranking:
- **94% of 2026 sales in the area were first sales from developers; resales were 0.7%.** Exit liquidity can't be measured yet, so the default view is labelled honestly: "demand, as a proxy for liquidity".
- **Launch bursts look like demand.** One project sold all 181 units in a single month, so demand *persistence* became a criterion.
- **The top is often a coin flip.** Under "demand first", the leader came first in only about half of plausible weightings. The tool says so, and tells the decision-maker to decide on the gaps, not the score.

## What's not good

- **Current calendar year only.** Year-on-year isn't computed, because the public source doesn't serve earlier data.
- **Numbers aren't independently reconciled yet.** The evaluation sets test which tool answers and what gets refused, not that each median is arithmetically right. That's the next piece of work.
- **The planner is keyword-based.** It's measured, not magic, and it will meet phrasings it hasn't seen.
- **Demand evidence is thin.** Most logged sessions so far are mine, so the roadmap's demand column fills in only as real use arrives.

## What I'd take to any AI product that informs decisions

1. **Write the evidence contract before the first line of code**, and enforce it in tests, not prompts.
2. **Let a different model write your evaluation set**, and publish the first-contact score, not the tuned one.
3. **Treat real users as your best test suite**, and make sure the rephrase gets noticed even when no one is watching.
4. **Keep a person on the gate** for anything that changes what the system believes is correct.

Building with AI let me take the question-answering layer and the decision workbench from idea to live in days rather than weeks, on my own. The scarce part wasn't the code. It was deciding what the product must refuse, and proving it does.
