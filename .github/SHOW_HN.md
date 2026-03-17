# Show HN: CrewForm — Open-source AI agent orchestration platform

> Copy-paste the **Title** and **Body** below into the Hacker News submission form.
> Best posting time: **Tuesday–Thursday, 8–9am EST**

---

## Title

Show HN: CrewForm – Open-source AI agent orchestration with visual UI (no Python needed)

## URL

https://github.com/CrewForm/crewform

## Body

Hey HN, I built CrewForm — an open-source platform for managing AI agent teams through a visual interface.

**What it does:** You create AI agents (pick a model, write a system prompt), assign them tasks, and optionally chain them into teams (pipeline, orchestrator, or collaboration modes). Everything runs through a web UI — no Python, no notebooks, no CLI.

**Why I built it:** I was using CrewAI and LangGraph for multi-agent workflows but wanted something my non-technical team members could use too. I also wanted to self-host and keep control of my API keys.

**Tech stack:**
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Supabase (Auth, PostgreSQL, Realtime, Edge Functions)
- Task Runner: Node.js service that polls for tasks and calls LLM APIs
- 14 LLM providers supported (OpenAI, Anthropic, Gemini, Groq, Mistral, etc.)

**Key features:**
- BYOK (Bring Your Own Key) — zero LLM cost markup
- 3 team orchestration modes (Pipeline, Orchestrator, Collaboration)
- Agent marketplace — install or publish templates
- Self-hostable via Docker Compose
- Zapier integration (7,000+ apps), Discord/Slack/Telegram channels
- Team memory via pgvector
- RBAC with 5-role hierarchy
- Real-time task monitoring

**Self-hosting is one command:** `docker compose up -d`

It's AGPL-3.0 (open-core model — enterprise features are separate).

I'd love feedback on the architecture, UX, or feature priorities. Happy to answer any questions.

Live demo: https://crewform.tech
Docs: https://docs.crewform.tech
