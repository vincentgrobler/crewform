# Twitter/X Launch Thread — CrewForm

> **Post timing:** Tuesday–Thursday, 8–10 AM ET for max engagement

---

**Tweet 1 (Hook)**

I just open-sourced CrewForm — a visual AI orchestration platform where you can deploy multi-agent workflows without writing Python or paying LLM markups.

Here's what it does and why I built it 🧵

---

**Tweet 2 (Problem)**

Most multi-agent AI platforms today:

💸 Mark up your LLM costs 30-50%
🔒 Lock you into their cloud
🎓 Require Python expertise to set up

I wanted: a UI, my own API keys, and the ability to self-host.

So I built it.

---

**Tweet 3 (Solution — Agents)**

🤖 Create AI agents from a visual UI

Pick your model (Claude, Gemini, GPT), write a system prompt, set temperature — done.

No boilerplate. No SDK. Just configure and deploy.

[Screenshot: Agent creation form]

---

**Tweet 4 (Solution — Teams)**

👥 Chain agents into Pipeline Teams

Research Agent → Writer Agent → Editor Agent

Each step gets the previous output. Configure retry/stop/skip on failure.

Like CI/CD pipelines, but for AI agents.

[Screenshot: Pipeline team builder]

---

**Tweet 5 (BYOK)**

🔑 BYOK = Bring Your Own Key

Connect your Anthropic, Google, or OpenAI keys directly.

CrewForm encrypts them with AES-256-GCM.
You pay your provider at their standard rates.
Zero markup. Zero middleman.

---

**Tweet 6 (Self-Hosting)**

🏠 Self-host with one command:

```
docker compose up -d
```

PostgreSQL + nginx + task runner. Your data stays on your infrastructure.

Or use our hosted version at crewform.tech.

---

**Tweet 7 (Marketplace)**

🏪 Agent Marketplace

Share your best agents with the community. Install pre-built templates in one click.

Free agents show their system prompt. Premium agents keep theirs locked until purchase.

[Screenshot: Marketplace browse]

---

**Tweet 8 (Analytics)**

📊 Built-in usage tracking

Token usage, cost estimates, status distribution, top models — all visualized.

Know exactly what your agents cost, per task, per team, per month.

[Screenshot: Analytics dashboard]

---

**Tweet 9 (Tech Stack)**

⚡ Tech stack:

- React + TypeScript + Vite
- Supabase (Auth, DB, Realtime)
- Node.js task runner
- Docker for self-hosting
- AGPL v3 license

Clean codebase. Well-documented. Contributions welcome.

---

**Tweet 10 (CTA)**

CrewForm is in beta and I'm looking for early users and feedback.

⭐ Star on GitHub: github.com/vincentgrobler/crewform
🌐 Try it: crewform.tech
💬 Join Discord: discord.gg/NpcWr9d7

What agent workflows would you build? Reply and I'll help you set them up 👇
