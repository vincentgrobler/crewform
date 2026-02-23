<div align="center">

# CrewForm

### Form your crew

**AI Orchestration for Everyone**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

[Website](https://crewform.tech) · [Docs](https://docs.crewform.tech) · [Discord](#) · [Twitter](#)

</div>

---

## What is CrewForm?

CrewForm is an open-source multi-agent AI orchestration platform. Deploy, manage, and collaborate on AI agent workflows — without vendor lock-in or LLM cost markup.

**Key features:**
- 🤖 **Agent Management** — Create, configure, and monitor AI agents from a visual UI
- 👥 **Team Modes** — Orchestrate agents using Pipeline, Orchestrator, or Collaboration patterns
- 🔑 **BYOK** — Bring Your Own Keys. Pay your LLM provider directly, zero markup
- 🏪 **Marketplace** — Share and discover agent templates
- 🏠 **Self-Hostable** — Run on your own infrastructure with Docker
- 🔒 **Secure** — AES-256-GCM encryption, RLS multi-tenancy, GDPR-ready

## Quick Start

```bash
# Clone the repo
git clone https://github.com/vincentgrobler/crewform.git
cd crewform

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development server
npm run dev
```

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + ShadCN UI
- **Backend:** Supabase (Auth, Database, Realtime, Storage)
- **Task Runner:** Node.js
- **Deployment:** Vercel + Docker

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

CrewForm is licensed under the [GNU Affero General Public License v3.0](LICENSE).

---

<div align="center">

**CrewForm** — Form your crew ⚡

</div>
