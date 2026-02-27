# Phase 3 — Integration Roadmap

Priority-ordered plan for third-party integrations. Each entry describes what it is, how it fits into CrewForm, and the implementation approach.

---

## Priority 1: Zapier

**Impact:** Biggest distribution multiplier — connects CrewForm to 5,000+ apps.

**Two integration directions:**

1. **CrewForm as a Zapier Action** — Users trigger agents from any Zapier-connected app. Requires building a Zapier app using CrewForm's public API (`POST /api/tasks`). Users paste their API key and configure which agent runs.

2. **Zapier as a Webhook Destination** — Agent finishes → fires Zapier webhook → routes result anywhere. This is simpler — it's a generic HTTP webhook pointed at a Zapier webhook URL. Already supported today via the HTTP destination type, but worth adding a named "Zapier" destination with a guided setup flow.

**Effort:** Medium. Zapier app submission requires their developer platform review.

---

## Priority 2: Perplexity

**Impact:** Best-in-class web research model. Low effort, high value.

**Approach:** Add Perplexity as a model provider alongside OpenAI, Anthropic, and Google. Perplexity's API is OpenAI-compatible, so it can reuse the existing OpenAI provider with a different base URL. Users add their Perplexity API key in Settings → API Keys.

**Effort:** Low. Mostly configuration — add to `MODEL_OPTIONS`, provider detection, and API key management.

---

## Priority 3: Asana

**Impact:** Popular with the exact teams that would use CrewForm (project managers, ops teams).

**Approach:**
- **Inbound trigger:** Asana webhook fires when task is created/updated → CrewForm agent runs on the task content.
- **Output routing:** Agent result writes back to Asana task as a comment via Asana REST API.
- Requires OAuth2 integration for user authentication with Asana.

**Effort:** Medium. OAuth flow + bidirectional sync.

---

## Priority 4: Isara

**Impact:** Differentiates CrewForm on trust/safety. Monitoring AI agent output for accuracy, safety, and compliance.

**Two integration paths:**

1. **Built-in monitoring layer:** Every task output passes through Isara scoring before delivery. Add a post-processing step in the task runner.
2. **Marketplace tool:** Optional "Quality Guard" wrapper that agents can call to validate their output.

**Effort:** Medium. Requires API partnership discussion with Isara team.

---

## Priority 5: Otter.ai

**Impact:** Killer demo use case — meeting ends → transcript → agent → action items.

**Approach:** Otter.ai fires a webhook when a meeting transcript is ready. CrewForm receives the transcript as agent input, summarises it, extracts action items, and optionally routes results to Slack/Teams/Asana.

**Effort:** Low-Medium. Otter webhook → CrewForm trigger mapping.

---

## Priority 6: Decktopus

**Impact:** Transforms agent output from text into ready-to-present slide decks.

**Approach:** Add Decktopus as an output routing destination. Agent completes → result sent to Decktopus API → slides generated. The task result includes a link to the generated presentation.

**Effort:** Medium. Requires Decktopus API integration and async result handling.

---

## Priority 7: Motion

**Impact:** AI calendar + task management, similar sync pattern to Asana.

**Approach:** Motion task created → triggers CrewForm agent. Agent result writes back. Motion's API is well-documented.

**Effort:** Medium. Similar to Asana integration.

---

## Priority 8: Grammarly

**Impact:** Quality pass on all writing agent output.

**Approach:** Add Grammarly Developer API as a post-processing tool in the output pipeline. Writing agents pipe their output through Grammarly for grammar, clarity, and tone adjustments before delivery.

**Effort:** Low-Medium. Grammarly has a Text API for programmatic checks.

---

## Not Technical Integrations

### Wispr Flow (UX Recommendation)
Voice-to-text tool that types anywhere on Mac. Not an API integration — mention in docs/onboarding as a power-user tip for dictating task descriptions and prompts.

### Beettoo (GTM Partner)
B2B marketing agency. Potential customer and/or go-to-market partner. Agencies like Beettoo use tools like CrewForm to automate research, content, and reporting for clients. Worth direct outreach.
