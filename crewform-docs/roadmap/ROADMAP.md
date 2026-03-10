# CrewForm — Product Roadmap

> **Version:** 1.0 · **Author:** Sam (Writer Agent) · **Date:** 2026-02-23  
> **Research basis:** `research/roadmap/crewform-roadmap.md` (Ava, 56KB roadmap research)  
> **Audience:** Smith (Developer Agent), Vince (CEO/Founder), Contributors

---

## Table of Contents

1. [Overview](#1-overview)
2. [Phase 1: MVP (Weeks 1–12)](#2-phase-1-mvp-weeks-112)
3. [Phase 2: Growth (Months 4–6)](#3-phase-2-growth-months-46)
4. [Phase 3: Scale (Months 7–12)](#4-phase-3-scale-months-712)
5. [Milestone Summary](#5-milestone-summary)
6. [Technology Decision Points](#6-technology-decision-points)
7. [Resource Requirements](#7-resource-requirements)
8. [Risk Register](#8-risk-register)

---

## 1. Overview

CrewForm targets a **12-week MVP** followed by two growth phases through Month 12. The build plan prioritises **working product over feature completeness**: Pipeline mode ships in the MVP; Orchestrator and Collaboration modes follow in Phases 2 and 3 respectively.

**Key decisions baked into this roadmap:**

- **MVP discipline:** Pipeline Mode only for teams. No marketplace publishing. No Collaboration/Orchestrator modes. Ship something that works flawlessly.
- **Build order (Teams):** Pipeline → Orchestrator → Collaboration. Each mode builds on the same database schema.
- **Agent runtime:** OpenClaw-backed for MVP; standalone Task Runner in Phase 2.
- **Billing gates:** Implemented in Phase 2. MVP has no billing enforcement — just foundation.

| Phase | Duration | Goal | Milestone |
|-------|----------|------|-----------|
| **Phase 1: MVP** | Weeks 1–12 | Working product with agents, tasks, Pipeline teams | **Beta Launch** |
| **Phase 2: Growth** | Months 4–6 | Orchestrator mode, RBAC/teams, Marketplace v1, billing | **General Availability (GA)** |
| **Phase 3: Scale** | Months 7–12 | Enterprise, Collaboration mode, self-hosted, marketplace v2 | **Enterprise Launch** |

---

## 2. Phase 1: MVP (Weeks 1–12)

**Goal:** A publicly launchable product: create agents, assign tasks, run Pipeline teams, track results — all secured behind auth with BYOK API key management.

**Alpha milestone:** End of Sprint 4 (Week 8) — internal team can use it daily  
**Beta milestone:** End of Sprint 6 (Week 12) — public beta launch on Product Hunt

### Sprint 1–2: Project Scaffold, Auth, Database Schema, UI Shell (Weeks 1–2)

**Goal:** Everything compiles, auth works, user can log in and see a blank dashboard.  
**Dependency:** None — day zero.

| Ticket | Description | Size | Risk |
|--------|-------------|------|------|
| **1.1** | Repo scaffold: Vite + React 18 + TS strict + Tailwind + ShadCN + React Router + TanStack Query + Zustand. Vercel auto-deploy. | S | Low |
| **1.2** | Supabase project setup (eu-west-2): Auth config, storage buckets (`agent-avatars`, `task-attachments`, `task-results`), typed client + AuthContext. | S | Low |
| **1.3** | Database schema: all core tables + team tables (stub). RLS enabled on every table. Key indexes. pgvector extension enabled. | M | **Medium** — schema decisions are hard to undo |
| **1.4** | Auth UI: Login, Register, Password Reset, Google OAuth, protected route wrapper. | M | Low |
| **1.5** | App Shell: sidebar nav, top bar, dark theme (`bg-gray-950`), responsive layout, skeleton loading. | S | Low |

**Go/No-Go →** Team can log in. Schema reviewed, approved, merged. All migrations run cleanly. Zero TS errors in CI.

---

### Sprint 3–4: Agent CRUD, Configuration UI, BYOK (Weeks 3–4)

**Goal:** Users can create, configure, manage agents. API keys stored securely.  
**Dependency:** Sprint 1–2 complete.

| Ticket | Description | Size | Risk |
|--------|-------------|------|------|
| **2.1** | Agent list page: grid of agent cards, empty state, status indicator (green/yellow/grey), React Query caching. | M | Low |
| **2.2** | Create Agent form: 5 pre-built templates (Developer, Writer, Researcher, Designer, Assistant), Zod validation, avatar upload. | M | Low-Med |
| **2.3** | Agent detail & edit: inline editing, performance stats, delete with name-confirmation. | M | Low |
| **2.4** | BYOK API key management: AES-256-GCM encryption via Edge Function, "Test connection" button, masked display, RLS. | M | **High** — security-critical |
| **2.5** | Database Adapter interface: all calls through `db.*`, no direct `supabase.from()`. | S | Low |

**Go/No-Go →** Agent CRUD works. At least one API key stored + tested. Encryption confirmed (no plaintext in DB). Model selector filtered by configured keys.

---

### Sprint 5–6: Task Dispatch Engine, Pipeline Teams, Real-time (Weeks 5–6)

**Goal:** Tasks dispatched and tracked in real-time. Basic Pipeline team runs work end-to-end.  
**Dependency:** Sprint 3–4 complete.

| Ticket | Description | Size | Risk |
|--------|-------------|------|------|
| **3.1** | Task list & creation: table view, filter bar (status/agent/priority), CreateTaskModal. | M | Low |
| **3.2** | Task detail panel: slide-out, Supabase Realtime subscription, markdown rendering, cancel button. | M | Medium |
| **3.3** | **Task Runner service** (Node.js): polling loop, atomic task claiming (`FOR UPDATE SKIP LOCKED`), LLM executors (Anthropic/Google/OpenAI), streaming output, token/cost tracking, 5-min timeout. Docker. | **L** | **High** — most complex MVP piece |
| **3.4** | Auto-dispatch: DB trigger on `tasks.status` → `agent_tasks` INSERT; "Start Task" UI button. | M | Medium |
| **3.5** | Pipeline Teams — create & configure: team list, `PipelineConfigPanel`, drag-to-reorder steps (@dnd-kit), validation. | M | Low |
| **3.6** | **Pipeline Teams — execute & monitor:** "Run Team" → PipelineExecutor in Task Runner; `TeamHandoffContext` building; real-time pipeline progress rail; activity timeline; step retry logic. | **L** | **High** — complex handoff + Realtime |

**Go/No-Go →** End-to-end: agent → task → result (single-agent). End-to-end: pipeline team (2+ agents) → run → all steps complete. Real-time updates work. Task Runner runs in Docker.

> ⚠️ **Sprint 5–6 is the highest-risk sprint.** Task Runner + Pipeline Teams are the most complex pieces. Smith should dedicate 100% focus here. Everything before is scaffolding; everything after is iteration.

---

### Sprint 7–8: Dashboard, Analytics, Usage Tracking, REST API (Weeks 7–8)

**Goal:** Meaningful dashboard with activity, costs, and performance metrics. REST API live.  
**Dependency:** Sprint 5–6 complete (tasks running, usage_records written).

| Ticket | Description | Size | Risk |
|--------|-------------|------|------|
| **4.1** | Dashboard: stat cards (tasks this month / running / completed / failed), agent performance grid, activity timeline, quick actions. | M | Low-Med |
| **4.2** | Analytics charts: task completion over time (Recharts), cost by agent, status distribution (donut), top models by usage. Date range picker. | M | Low |
| **4.3** | Usage records integration: Task Runner writes `usage_records` per completion. Billing model detection (per-token vs subscription-quota). Analytics Edge Function with materialized view. | M | Low-Med |
| **4.4** | REST API (Supabase Edge Functions): full CRUD for agents, tasks, teams + runs. JWT + API key auth. Zod validation. | M | Low-Med |

**Go/No-Go →** Dashboard loads real data. Analytics charts render for last 30 days. Usage records written for every completed task. All REST API endpoints work (curl test). Subscription providers show "Subscription" not "$0.00".

---

### Sprint 9–10: Marketplace Foundation, Self-Hosting (Weeks 9–10)

**Goal:** Read-only marketplace with 10–15 curated agents. Docker Compose self-hosting.  
**Dependency:** Sprint 7–8 complete.

| Ticket | Description | Size | Risk |
|--------|-------------|------|------|
| **5.1** | Marketplace DB schema: `is_published`, `marketplace_tags`, `install_count`, `rating_avg` columns + `agent_installs` + `agent_reviews` tables. | S | Low |
| **5.2** | Marketplace browse page: grid, search, tag filters, sort (installs/rating/newest), detail modal. 10–15 hand-crafted seed agents. | M | Low |
| **5.3** | Install agent flow: clone agent into workspace, increment `install_count`, record `agent_installs`. | M | Low |
| **5.4** | Self-hosting: `docker-compose.yml`, Dockerfiles (frontend + task-runner), auto-migrations, `.env.example`, `docs/self-hosting.md`. Tested on fresh Ubuntu 24.04. | M | Medium |

**Go/No-Go →** Marketplace shows 10+ curated agents. Install flow works e2e. Installed agent runs tasks. `docker-compose up` works on clean machine.

---

### Sprint 11–12: Polish, Testing, Documentation, Beta Launch (Weeks 11–12)

**Goal:** Public beta launch. Stable, documented, performant.  
**Dependency:** Sprints 1–10 complete.

| Ticket | Description | Size | Risk |
|--------|-------------|------|------|
| **6.1** | E2E testing (Playwright): 4 critical paths. Unit tests for encryption, billing model detection, handoff context. GitHub Actions CI. | M | Medium |
| **6.2** | Lighthouse audit: LCP < 2.5s, FCP < 1.0s, CLS < 0.1. Bundle < 500KB gzipped. Lazy-load Recharts. | S | Low |
| **6.3** | Error handling & empty states: audit every page for missing loading/error/empty states. | S | Low |
| **6.4** | Documentation: README, quickstart, self-hosting guide, API reference, agents guide, pipeline teams guide. Landing page at `crewform.tech`. | M | Low |
| **6.5** | Beta launch prep: Product Hunt assets, HN "Show HN" draft, Twitter thread, Discord server, 20+ beta users invited. | S | Low |

**Go/No-Go (Beta Launch Checklist):**

| Category | Criteria |
|----------|----------|
| **Security** | All API keys encrypted (AES-256-GCM). RLS on all tables. HTTPS only. No secrets in git. |
| **Functionality** | Full user journey e2e. Pipeline teams execute. Marketplace install works. Docker self-hosting works. |
| **Performance** | Dashboard < 2s. Lighthouse ≥ 85. |
| **Docs** | Quickstart, API docs, self-hosting guide complete. |
| **Launch** | Product Hunt assets ready. `crewform.tech` live. |

---

## 3. Phase 2: Growth (Months 4–6)

**Goal:** Team collaboration, Orchestrator mode, Marketplace v1 with community publishing, Stripe billing, advanced analytics.  
**Milestone:** **General Availability (GA)** — paying customers, billing enforced, Team tier live.

**Go/No-Go from Phase 1:** ≥ 50 active beta users, ≥ 10 providing regular feedback, pipeline mode in production use, no critical security incidents.

### Month 4: Orchestrator Mode + Webhooks + Swarm Foundation

| Feature | Size | Description |
|---------|------|-------------|
| **Team Engine: Orchestrator Mode** | L (2–3 weeks) | `OrchestratorExecutor`: brain agent receives task + worker list; delegates via tool call; workers execute; brain evaluates quality → accept or request revision. Delegation tree UI. |
| **Webhook Support** | M (1 week) | `output_routes` table, HTTP/Slack/Discord destinations, retry with exponential backoff, management UI in agent settings. |
| **Proactive Agent Triggers** | M (1.5 weeks) | Trigger engine: schedule (CRON), webhook, data threshold, idle detection. Suggestion queue with approve/dismiss. Dashboard badge. |
| **Task Calendar View** | M (1 week) | Day/week/month calendar view, drag-and-drop scheduling, recurring task patterns (RFC 5545). |
| **Swarm: Runner Registry & Heartbeat** | M (1 week) | `task_runners` table tracking active runner instances (instance name, status, last heartbeat, max concurrency, current load). Runners self-register on startup, send heartbeats every 10s, deregister on shutdown. Postgres function marks runners as `dead` when heartbeat is stale (>30s). |
| **Swarm: Stale Task Recovery** | S (3 days) | Recovery function resets orphaned `running` tasks back to `dispatched` when their claiming runner is marked `dead`. Prevents zombie tasks from permanently blocking the queue. |

### Month 5: Team Workspaces, RBAC, Invitations

| Feature | Size | Description |
|---------|------|-------------|
| **Multi-user Workspace** | L (2–3 weeks) | Invitations (email magic link), 5-role RBAC (Owner/Admin/Manager/Operator/Viewer), RLS policy updates, audit log viewer. |
| **Advanced Analytics** | M (1 week) | Time-series cost per agent, "time saved" calculator, CSV export, org-level aggregate. |
| **Prompt Version History** | S (3 days) | `agent_prompt_history` table, diff viewer, rollback to any version. |

### Month 6: Stripe Billing + Marketplace v1

| Feature | Size | Description |
|---------|------|-------------|
| **Stripe Integration** | L (2–3 weeks) | Subscriptions (Pro $39/mo, Team $149/mo), checkout, webhook handling, licence key validation, feature gates in UI + API. |
| **Marketplace v1** | M (1.5 weeks) | Community publishing with review queue, automated prompt injection scan, creator dashboard. |

**Phase 2 Go/No-Go for Phase 3:**
- ≥ 200 active users
- ≥ 50 paying customers (Pro or Team)
- Stripe billing working without issues
- Orchestrator mode used by ≥ 10 teams
- No security incidents

---

## 4. Phase 3: Scale (Months 7–12)

**Goal:** Enterprise readiness, Collaboration mode (biggest differentiator), polished self-hosted offering, Marketplace v2 with revenue share.  
**Milestone:** **Enterprise Launch** — first enterprise deal closed.

**Go/No-Go from Phase 2:** Billing stable, team workspaces in production use, 1+ enterprise pilot signed, security audit clean.

### Months 7–8: Enterprise Foundation + Collaboration Mode

| Feature | Size | Description |
|---------|------|-------------|
| **SSO / SAML** | L (2–3 weeks) | Okta, Azure AD, Google Workspace. JIT provisioning. SCIM (stretch). |
| **Audit Logs Enhancement** | M (1 week) | Exportable JSON/CSV, log streaming to Datadog/Splunk via webhook. |
| **Collaboration Mode** | L (3 weeks) | `CollaborationExecutor`: shared message thread, speaker selection (round-robin, LLM-select, facilitator), termination conditions, real-time chat UI, human-in-the-loop. |

### Months 8–9: Self-Hosted Polish + Security Hardening

| Feature | Size | Description |
|---------|------|-------------|
| **Self-Hosted Package** | M (2 weeks) | Helm chart (K8s), AWS ECS guide (Terraform), DigitalOcean 1-click, automated update mechanism, licence key validation. |
| **Security Hardening** | M (2 weeks) | External pen test, MFA (TOTP) rollout, CSP headers hardened, dependency audit, SOC 2 Type I preparation. See `SECURITY.md`. |

### Months 9–10: Marketplace v2 + Revenue Share

| Feature | Size | Description |
|---------|------|-------------|
| **Stripe Connect** | L (2 weeks) | Creator payouts (70/30), monthly payout run, $50 minimum threshold, creator earnings dashboard. |
| **Premium Agent Execution** | M (1 week) | Server-side execution for paid marketplace agents (protects creator prompts). Per-execution billing. |

### Months 10–12: API v2 + Multi-Region + Team Memory + Swarm Scaling

| Feature | Size | Description |
|---------|------|-------------|
| **API v2** | M (2 weeks) | Versioned `/v2/` endpoints, webhook SDK (TypeScript + Python), per-tier rate limiting, API key management UI. |
| **OAuth Provider Authentication** | M (2 weeks) | Connect LLM providers via OAuth instead of API keys. **Google Cloud:** OAuth 2.0 / service account auth for Vertex AI (project-scoped, no API key needed). **Anthropic:** OAuth token flow for Claude API. Provider settings UI shows "Connect with Google" / "Connect with Anthropic" alongside existing BYOK. Token refresh handled in Task Runner. |
| **Multi-Region** | L (3 weeks) | Supabase EU + US, Fly.io multi-region Task Runner, data residency selector per org. |
| **Team Memory (pgvector)** | M (2 weeks) | Enable `team_memory` table. Summarise run outputs → embed → store. Vector search relevant memories → inject into handoff context. Knowledge base viewer UI. |
| **Swarm: Concurrent Task Processing** | M (1 week) | Replace serial `isPolling` mutex with a concurrency pool (configurable `MAX_CONCURRENT` per runner, default 3). Each runner claims up to N tasks in parallel, tracks active slots, and updates `current_load` in `task_runners` table. |
| **Swarm: Adaptive Polling** | S (3 days) | Replace fixed 5s polling interval with exponential backoff: start at 1s when work is available, scale up to 15s during idle periods. Reduces unnecessary DB queries under low load, improves responsiveness under high load. |

---

## 5. Milestone Summary

| Milestone | Target Date | Go/No-Go Criteria |
|-----------|-------------|---------------------|
| 🏗️ **Alpha (Internal)** | Week 8 | Team can use it daily; agents execute; pipeline runs |
| 🚀 **Beta Launch** | Week 12 | Product Hunt launch; 20+ external users; all MVP acceptance criteria met |
| 💰 **GA (General Availability)** | Month 6 | Billing live; 50+ paying customers; Team tier available |
| 🏢 **Enterprise Launch** | Month 9 | SSO; audit logs; SOC 2 Type I report; first enterprise deal |
| 🌍 **Scale** | Month 12 | Multi-region; Collaboration mode; 200+ paying customers |

**Revenue model timeline:** Free beta (Weeks 12–20) → Billing gates enforced Month 6 → First Enterprise deal Month 9–12. Target Month 12: $10K MRR ($120K ARR) — achievable with 50 Pro + 15 Team + 1 Enterprise customer.

---

## 6. Technology Decision Points

These decisions must be made at specific points. Do not defer.

| Decision | When | Recommendation |
|----------|------|----------------|
| Task Runner hosting | Sprint 5 | Railway (simpler for MVP); Fly.io for Phase 2 multi-region |
| Job queue (Phase 2) | Month 4 | Inngest (fully managed, Supabase-friendly) |
| Email provider | Sprint 11 | Resend ($0 for first 100/day, best DX) |
| Analytics product | Phase 2 | PostHog (self-hostable, generous free tier) |
| Monitoring | Phase 2 | Sentry (OSS, generous free tier) |
| Penetration testing | Month 8 | External firm when revenue justifies ($3–10K) |
| SOC 2 tooling | Month 9 | Vanta (~$15K/year, best for small teams) |
| Swarm concurrency model | Month 4 | Postgres-native (`FOR UPDATE SKIP LOCKED` already in place). No Redis/RabbitMQ needed until multi-region. |

---

## 7. Resource Requirements

| Phase | Role | Commitment | Notes |
|-------|------|-----------|-------|
| Phase 1 (Weeks 1–12) | Smith (Developer) | Full-time | All backend + frontend |
| Phase 1 | Vince (CEO/Product) | ~20% | Design feedback, product decisions, domain/hosting |
| Phase 2 (Months 4–6) | Smith | Full-time | Orchestrator, billing, RBAC |
| Phase 2 | Vince | ~20% | GTM, user interviews, content |
| Phase 2 | Part-time contractor | 10–20hrs/week | Marketplace UI, documentation |
| Phase 3 (Months 7–12) | Smith | Full-time | Enterprise, Collaboration, multi-region |
| Phase 3 | DevOps engineer | 20–30hrs/week | Kubernetes, Helm charts, infrastructure |
| Phase 3 | Vince | ~30% | Enterprise sales, fundraising, partnerships |

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Task Runner stability in production | High | High | Atomic DB claiming, timeout enforcement, circuit breakers. Sentry monitoring. |
| Database schema changes mid-build | Medium | High | Define all team tables in Sprint 1. Never change schema without a migration. |
| Supabase Realtime reliability | Medium | Medium | Implement polling fallback (30s) if Realtime subscription drops. |
| Encryption key loss | Low | Critical | Store DEK in Supabase Vault + 1Password. Key rotation via env var + re-encryption job. |
| Competitor launches marketplace first | Medium | High | Speed is the mitigation. Don't scope creep. Launch in Week 12. |
| Smith blocked or sick (sole developer) | Medium | High | Vince must unblock basics. Document all setup steps. Weekly status check. |
| Stripe billing bugs at launch | Medium | Medium | Test with Stripe test mode extensively. Webhook monitoring. Manual fallback for early customers. |
| Task Runner crash leaves zombie tasks | Medium | High | Swarm heartbeat + stale task recovery (Phase 2 Month 4). Runner registry provides visibility. |

---

*Document Version: 1.0 · Last Updated: 2026-02-23 · Author: Sam (Writer Agent)*  
*Source: Ava's roadmap research (`research/roadmap/crewform-roadmap.md`)*
