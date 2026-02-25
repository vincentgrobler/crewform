# Show HN: CrewForm — Open-source multi-agent AI orchestration with a visual UI

I've been building AI agent workflows for the past year and kept running into the same friction: existing platforms either charge a markup on LLM costs, lock you into their stack, or require you to write Python orchestration code from scratch.

So I built CrewForm — an open-source (AGPL v3), self-hostable platform that wraps multi-agent orchestration in a deployable web application with a visual UI.

**What it does:**

- **Agent Management**: Create and configure AI agents from a visual UI (model selection, system prompts, temperature, tools)
- **Pipeline Teams**: Chain agents sequentially — each agent's output feeds into the next (e.g., Research Agent → Writer Agent → Editor Agent)
- **BYOK (Bring Your Own Key)**: Connect your Anthropic/Google/OpenAI API keys directly. CrewForm never touches your LLM spend.
- **Marketplace**: Share and install agent templates
- **Analytics**: Token usage, cost tracking, and performance metrics per agent
- **Self-Hosting**: One-command Docker Compose deployment

**Tech stack:** React + TypeScript + Vite (frontend), Supabase (auth, DB, realtime), Node.js task runner (multi-provider LLM execution). API keys are encrypted with AES-256-GCM. All tables have Row-Level Security.

**How it compares to crewAI/AutoGen/LangGraph:** Those are excellent Python libraries for building agent systems in code. CrewForm is a full-stack application with a UI, team collaboration, and marketplace — more like "Vercel for AI agents" than a Python framework. They're complementary.

**What's next:** Orchestrator mode (brain agent delegates to workers), webhooks, Stripe billing, and community agent publishing.

We're in beta and actively looking for feedback. The codebase is clean, well-documented, and contributions are welcome.

GitHub: https://github.com/vincentgrobler/crewform
Live: https://crewform.tech
Docs: https://github.com/vincentgrobler/crewform/tree/main/docs
Discord: https://discord.gg/NpcWr9d7

Would love to hear what you think — especially around what team modes (Pipeline, Orchestrator, Collaboration) would be most useful for your workflows.
