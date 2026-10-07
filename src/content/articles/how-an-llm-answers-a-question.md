---
title: "How an LLM Answers 'What Is the Capital of France?' — Every Concept, One Example"
date: "2026-10-07"
excerpt: "Tokens, embeddings, parameters, pretraining, fine-tuning, reinforcement learning, inference, temperature, RAG, hallucinations — all on one question, from the keystroke to 'Paris'. A builder's notes after going back to the fundamentals."
image: "/images/llm-pipeline.png"
slug: "how-an-llm-answers-a-question"
---

I build with large language models every day: a digital clone on this site, a refusal-aware Q&A over Dubai property data, agents that run unattended. Last week I realised I could use all of it fluently and still not explain, from first principles, what happens between pressing enter and seeing an answer.

So I went back to the fundamentals, mostly through Andrej Karpathy's three most-watched talks: *Intro to Large Language Models*, *Deep Dive into LLMs like ChatGPT*, and *Let's build GPT*. These are my notes, rebuilt around a single question so every concept has somewhere to sit:

> **"What is the capital of France?"**

We'll follow it from the keystroke to "Paris", then step back and ask how the model knew. Where a concept changed how I build, I say so.

![The path of one question through an LLM: system prompt, tokens, embeddings, transformer, probabilities, sampling, repeat](/images/llm-pipeline.png)

## The short version

An LLM is **next-token prediction**, scaled up on a compressed copy of the internet, shaped into an assistant, and now trained to reason. Every clause in that sentence is one of the sections below.

## What is a token?

**A token is a chunk of text — often a word or part of a word — converted to a number, because the model only does arithmetic.**

Here is our question run through GPT-4's actual tokenizer:

```text
"What is the capital of France?"

 What  │  is  │  the  │  capital │  of  │  France │  ?
 3923  │ 374  │  279  │   6864   │ 315  │   9822  │  30

7 tokens. The leading space is part of each token.
```

GPT-4's vocabulary has about 100,000 of these chunks. Common words are one token; rarer ones split. This explains a famous failure: ask a model how many R's are in "strawberry" and it often gets it wrong. Without a leading space, "strawberry" is three tokens: `str` · `aw` · `berry`. The model never sees the individual letters, so it isn't counting them — it's guessing.

**What it changed for me:** tokens are also the unit you pay for. The clone on this site logs its token cost for every conversation, so cost per chat is a measured number, not an estimate.

## What is an embedding?

**An embedding turns each token's ID into a long list of numbers that captures its meaning.**

Token 9822 is just a jersey number; it means nothing on its own. The model looks up a learned vector for it — hundreds or thousands of numbers — and words with related meanings end up with similar vectors. "Paris" sits near "London"; "France" sits near other countries. This is the step where an ID becomes something the model can reason with.

## What are "parameters"?

**Parameters are the model's billions of adjustable numbers — picture a mixing desk with billions of knobs. Their exact settings *are* everything the model knows.**

Karpathy's sharpest framing: an open model like Llama 2 70B is just **two files**. One holds the parameters — 70 billion numbers, about 140 GB. The other is a few hundred lines of code that runs them. The code is trivial. All the value, and all the cost, is in finding the right setting for every knob.

Those settings are a **lossy compression of the internet**. Like a blurry zip file, the model keeps patterns and gist, not exact records — which is why it can be brilliant and wrong in the same sentence.

## What happens inside when I press enter?

**The model runs its frozen parameters forward and produces a probability for every possible next token. This is called inference.**

```text
TRAINING  (done once, months before you type)     INFERENCE  (every time you ask)
  reads text → guesses → measures the error         your tokens → frozen parameters
  → adjusts the knobs, billions of times            → probabilities → pick one token
  Knobs CHANGE. Costs millions.                      Knobs LOCKED. Costs fractions of a cent.
```

Inside, the core mechanism is **self-attention**. Every token looks back at the tokens before it and pulls in what's relevant. Each token produces a *query* ("what am I looking for?"), a *key* ("what do I contain?") and a *value* ("what do I pass on if you attend to me?"). Where a query matches a key strongly, information flows. That's how "capital" and "France" find each other and the model assembles the sense that you're asking for a city. Stack dozens of these layers and you have a transformer.

Out of the end comes a probability for every token in the vocabulary — say "Paris" very high, "The" lower, "Lyon" tiny.

## How does it choose the next word?

**Softmax turns the raw scores into percentages that add up to 100; temperature controls how boldly it picks among them.**

Low temperature means it almost always takes the top choice — right for facts. High temperature means it sometimes takes a less likely token — useful for creative writing, risky for facts. Because it *samples*, the same prompt can give different answers on different runs.

Then the crucial part: it adds the chosen token to the sequence and **runs the whole thing again** for the next one. One model, one token at a time, until the answer is complete: *"The capital of France is Paris."* There aren't several models taking turns — it's the same model looping.

## How did it know "Paris" in the first place?

**Three training stages, each with a different answer key.** This is the part I'd never been able to state clearly, and the "who decides right or wrong?" question is what finally made it click.

![Three training stages and who decides right or wrong at each](/images/llm-training-stages.png)

### Stage 1 — Pretraining: knowledge

The model reads a filtered slice of the internet — tens of terabytes, cleaned of spam and duplicates — and plays one game billions of times: hide the next word, guess it, check.

It sees *"The capital of France is ___"*, guesses "banana", and the real text says "Paris". **Who decided that was wrong? Nobody — the text itself is the answer key.** The gap between the guess and the truth is the *loss*; *backpropagation* traces that error back through the network and works out which knobs to turn, and which way, to make "Paris" more likely next time.

The result is a **base model**: a very knowledgeable document-completer. Ask it our question and it may well continue with *"What is the capital of Germany? What is the capital of Spain?"* — because on the internet, questions are often followed by more questions. It knows things; it isn't trying to help.

### Stage 2 — Supervised fine-tuning: manners

Same game, different data: thousands of example conversations, each a question plus an ideal answer, written or curated by people following detailed guidelines. *Q: What is the capital of France? A: The capital of France is Paris.*

**Who decides? Humans, by demonstration.** The model learns to imitate. Special formatting tokens mark where the user's turn ends and the assistant's begins, which is how it learns to play the assistant. Pretraining gave it knowledge; fine-tuning gives it the habit of answering.

### Stage 3 — Reinforcement learning: reasoning

Now nobody shows it the answer. It attempts the problem many times on its own, and the attempts that work get reinforced. Fine-tuning is copying worked examples from a textbook; reinforcement learning is doing the practice problems and having them marked.

**Who decides? It depends on the problem — and this is the distinction worth knowing:**

- **Verifiable answers (maths, code).** "3 apples plus 5 apples" has one right answer, so a simple automatic check scores every attempt. Cheap, honest, and you can run it more or less indefinitely. This is how models learned to "think" — producing long chains of reasoning, checking themselves, backtracking — because longer, careful reasoning got rewarded with more correct answers. DeepSeek-R1 made this visible.
- **Matters of taste ("write a funny poem").** No automatic check exists. So people rank pairs of answers, a separate *reward model* is trained to imitate their preferences, and the main model is optimised against it. The catch: the reward model is an imitation of human judgement, and push too hard and the main model learns to **game it** — producing nonsense the scorer happens to love. So this stage (RLHF) gets stopped early. It gives a real but modest boost; it can't run forever.

**What it changed for me:** that second failure mode isn't unique to model training — it's every eval you tune against. My property Q&A scored 85% (34/40) on a question set written by a separate model that never saw the code. After I fixed what it caught, the same set reached 40/40. I quote the 85%, because once you've optimised against a test, it stops measuring what it measured.

## Does it remember what I told it?

**No. The parameters are a hazy long-term memory; the context window is a sharp, short-term working memory — and only the second one sees your conversation.**

```text
PARAMETERS (knowledge)                 CONTEXT WINDOW (working memory)
  set during training, then frozen       everything in this conversation:
  like something you read a year ago     system prompt + your messages + documents
  vague, can be misremembered            like a page open in front of you
  does NOT learn from your chat          sharp, but finite — and gone after the chat
```

Facts placed in the context are recalled far more reliably than facts buried in the parameters. That single idea explains three things:

- **The system prompt.** A model has no real self-knowledge — ask "who are you?" and the answer is whatever was trained or written in. Products put a hidden instruction at the start of every conversation to set identity and behaviour. My clone's system prompt is written intent-first: work out whether the visitor is hiring, collaborating or exploring before answering anything.
- **RAG — retrieval-augmented generation.** Before answering, fetch the relevant documents and paste them into the context. Asked about a refund policy, the system pulls the actual policy rather than hoping the model memorised it. You've moved the fact from hazy memory to the open page.
- **Why it "forgets".** The model doesn't learn from your conversation. When the chat ends, the working memory is gone; the knobs never moved.

## Why does it make things up?

**Because it was trained to always produce a confident, plausible continuation — and "I don't know" was rarely the plausible one.**

Every fine-tuning example was a confident answer, so faced with something it doesn't know, the model generates the most plausible-sounding text, which may be fabricated. Two mitigations: train it with examples where the right answer *is* "I don't know", and give it tools — search, documents — so the fact sits in its context instead of its memory.

**What it changed for me:** in my Dubai property Q&A, refusal is a product decision, not a model setting. The official data feed only serves the current year, so year-on-year comparisons are refused, not estimated; modelled rental yields are labelled as modelled. The system never gets the chance to be confidently wrong about something the data can't support.

## Why is it bad at maths?

**It predicts plausible-looking digits from patterns; it isn't running a calculator.** Ask for 4,837 × 219 and you may get a confident, nearly-right number. The fix is a tool: let the model call real code. In my property Q&A, every number is computed by code from the raw data; nothing depends on a model's arithmetic.

## Where is this heading?

Karpathy's frame is the **LLM as the kernel of a new operating system**: the model is the CPU, the context window is the RAM, and tools — a browser, a code interpreter, a calculator, other models — are the peripherals it orchestrates. Two trends drive it:

- **Scaling laws.** Next-token prediction improves predictably with more parameters and more data, and better prediction drags reasoning, coding and knowledge along with it. That's why the industry keeps building bigger clusters.
- **System 1 → System 2.** In 2023 he described models as purely fast and instinctive, with "converting time into accuracy" as the frontier. Reasoning models trained with reinforcement learning delivered exactly that within two years.

And a new attack surface comes with it: jailbreaks, **prompt injection** (instructions hidden in a web page or document the model reads), and poisoned training data. If your agent reads the web, assume something on the web is trying to give it orders.

## The whole journey, in one place

1. You type the question. A **system prompt** already sits in front of it.
2. **Tokenization** chops it into 7 numbered chunks.
3. **Embeddings** turn each ID into a vector of meaning.
4. **Self-attention** across stacked transformer layers lets "capital" and "France" inform each other.
5. **Inference** runs the frozen parameters forward to score every possible next token.
6. **Softmax** makes those scores percentages; **temperature** decides how boldly to pick.
7. It picks "The", appends it, and **loops** — one token at a time — to "Paris".
8. It knew "Paris" because of **pretraining** (knowledge, answer key = the text), **fine-tuning** (helpfulness, answer key = human examples) and **reinforcement learning** (reasoning, answer key = a verifier or a gameable reward model).
9. It could still be wrong — the knowledge is lossy — which is why serious systems use **RAG**, **tools** and **refusals**.

None of this is new. But being able to say it plainly turned out to matter: it's the difference between using these systems and being able to decide what they should and shouldn't be allowed to do.

*Sources: Andrej Karpathy — [Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g), [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI), [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY). Token IDs from OpenAI's `cl100k_base` tokenizer (GPT-4).*
