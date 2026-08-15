---
title: "I Built an n8n Workflow from Claude Code, via MCP"
date: "2026-07-02"
excerpt: "I built and ran a working automation without opening the tool's UI — driven end-to-end from Claude Code through MCP. The interesting part isn't that it worked. It's that the build path is itself guardrailed."
image: "/images/building-n8n-workflow-from-claude-code-via-mcp.png"
slug: "building-n8n-workflow-from-claude-code-via-mcp"
---

I built and deployed a working n8n automation recently without once opening n8n's canvas. The whole thing — picking nodes, wiring them, validating, creating it in my cloud instance, running it — happened from Claude Code, through MCP.

That's a small thing on its own. What's interesting is the *shape* of how it happened, because it's a preview of how agents are going to build software: not by free-typing into a UI, but by driving a tool's API through a contract that won't let them do the wrong thing.

## MCP, in one line

The Model Context Protocol is a standard way to hand an AI agent a set of tools — each with a typed schema the agent must respect. n8n ships an MCP server that exposes its workflow SDK as tools: search for nodes, fetch their exact parameter types, validate workflow code, create a workflow, execute it.

So the agent doesn't "imagine" an n8n workflow. It queries the real node catalog, gets the real parameter definitions, and is checked against them.

## The build loop

```text
   Claude Code
       │  ToolSearch → load the n8n MCP tool schemas
       ▼
   get_sdk_reference ──▶ search_nodes ──▶ get_node_types
       │                                      │
       │              exact parameter names   │
       ▼ ◀────────────────────────────────────┘
   write the workflow as SDK code
       │
       ▼
   validate_workflow ──── fail ────▶ rewrite ──┐
       │ pass                                  │
       ▼                                       │
   create_workflow_from_code  ◀────────────────┘
       │
       ▼
   execute_workflow → a real run, with output
```

Two details make this more than a party trick.

**You can't skip steps.** The server makes you fetch the node type definitions before it trusts your code, and makes you `validate` before it will `create`. Guessing parameter names — the thing an LLM loves to do — gets caught at the validation gate instead of silently producing a broken workflow.

**The validator has opinions.** My first attempt used a normal JavaScript array method to assemble a code string. The validator rejected it: that method isn't on the allow-list of operations the SDK permits. I rewrote it; it passed. The build environment is *deliberately* narrower than "any code that runs" — it's a constrained surface designed so an agent's mistakes fail loudly and early.

## The point: the build path is guardrailed too

I write a lot about putting [guardrails around agents that *act*](/articles/guardrailed-agent-human-in-the-loop) — confidence gates, human-in-the-loop, [deterministic pre-action checks](/articles/risk-guardian-rfc-7218). Watching this build loop, the same idea showed up one level out: the path by which an agent *constructs* something is also guardrailed. Schema-typed tools. A mandatory validation step. An allow-list of permitted operations. A creation step that refuses un-validated input.

That's not friction — it's what makes it safe to let an agent build at all. The same discipline that lets an agent act in production (validate before you commit, fail early, stay deterministic where it counts) is what lets an agent *build* in production without producing confident garbage.

## And the workflow itself?

The thing I built this way was, fittingly, a [guardrailed agent with a human-in-the-loop](/articles/guardrailed-agent-human-in-the-loop) — an agent that drafts an action, self-evaluates it, and either auto-executes or routes to a human. So: an agent, built by an agent, through a guardrailed tool contract, that itself implements guardrails.

It's turtles — but each turtle is a validation gate. Which is roughly the right way to build with this stuff.
