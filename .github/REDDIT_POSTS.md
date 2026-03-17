# Reddit Launch Posts

> Post one per subreddit. Wait 24 hours between posts to avoid looking spammy.
> Recommended order: r/selfhosted → r/opensource → r/SaaS

---

## r/selfhosted

### Title

CrewForm — self-hosted AI agent orchestration platform (Docker Compose, 14 LLM providers, BYOK)

### Body

Hey r/selfhosted! I built an open-source AI agent platform that you can self-host with Docker Compose.

**What it is:** A web UI for creating AI agents, assigning them tasks, and running multi-agent team workflows — all without writing code.

**Self-hosting:**
```bash
git clone https://github.com/CrewForm/crewform.git
cd crewform && cp .env.example .env
docker compose up -d
```

4 containers: PostgreSQL, auto-migrations, frontend (nginx), and a Node.js task runner.

**Key features:**
- BYOK (Bring Your Own Key) — connect 14 LLM providers, zero markup
- 3 team modes: Pipeline, Orchestrator, Collaboration
- Agent marketplace
- Real-time task monitoring
- Zapier + Discord/Slack/Telegram integrations
- RBAC with 5 roles
- Team memory (pgvector)
- AES-256-GCM key encryption, Row-Level Security

**Tech stack:** React, TypeScript, Supabase, Node.js, Docker

**License:** AGPL-3.0 (open-core — enterprise features in separate `ee/` directory)

GitHub: https://github.com/CrewForm/crewform
Docs: https://docs.crewform.tech
Live demo: https://crewform.tech

Would love feedback from the self-hosting community. What features would you want to see?

---

## r/opensource

### Title

CrewForm — Open-source AI agent orchestration platform (AGPL-3.0)

### Body

I've been working on CrewForm, an open-source platform for managing AI agent teams through a visual web interface.

**The problem:** Most multi-agent AI frameworks require Python and are developer-only tools. I wanted something my entire team could use.

**The solution:** CrewForm gives you a full web UI to create agents, assign tasks, build multi-agent pipelines, and monitor everything in real-time.

**What's open source (AGPL-3.0):**
- Full web UI (React + TypeScript)
- Agent CRUD + task dispatch
- Pipeline teams
- Marketplace (browse + install)
- Self-hosting (Docker Compose)
- 14 LLM providers
- BYOK key management
- Usage tracking

**Enterprise features (separate license):**
- Orchestrator + Collaboration modes
- Team memory (pgvector)
- RBAC
- Audit logs

We chose AGPL because we believe in open source but also need to sustain development. Would love thoughts on this model.

**GitHub:** https://github.com/CrewForm/crewform
**Docs:** https://docs.crewform.tech

Contributions welcome — we have a CONTRIBUTING.md and good first issues tagged.

---

## r/SaaS

### Title

I built an open-source alternative for AI agent orchestration — here's what I learned

### Body

Hey r/SaaS — I'm Vince, and I've been building CrewForm, an open-source AI agent platform.

**What it does:** Think of it as "project management for AI agents." You create agents (each with a model, system prompt, and tools), assign them tasks, and optionally chain them into teams that work together.

**The business model:**
- **Free tier:** 3 agents, 50 tasks/month (enough to try it)
- **Pro ($39/mo):** 25 agents, orchestrator mode, custom tools
- **Team ($99/mo):** Unlimited agents, collaboration mode, team memory, RBAC
- **Enterprise:** Custom pricing, audit logs, SSO (coming)

It's open-core: the Community Edition is AGPL-3.0 and fully self-hostable. Enterprise features require a license.

**Current traction:**
- Hosted at crewform.tech
- Self-hosting guide with Docker Compose
- Zapier integration live
- 14 LLM providers supported

**What I'd love feedback on:**
1. Is the pricing right for this space?
2. Which features would you pay for?
3. Would you prefer more free-tier capacity or more enterprise features?

GitHub: https://github.com/CrewForm/crewform
Live: https://crewform.tech
