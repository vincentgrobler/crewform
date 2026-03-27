---
title: 'A2A Protocol'
description: 'Agent-to-Agent interoperability — expose CrewForm agents to external AI systems and delegate tasks to remote agents'
---

## Overview

CrewForm supports the **A2A (Agent-to-Agent) protocol**, enabling your agents to communicate with external AI systems. This is the open standard for agent-to-agent interoperability.

<Info>A2A complements MCP (tools) and AG-UI (frontend) — together they form the **three agentic protocols** that CrewForm supports.</Info>

## How It Works

A2A provides two capabilities:

### A2A Server — Expose Your Agents

External platforms can discover and call your CrewForm agents via standard A2A endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/.well-known/agent.json` | GET | Agent Card discovery — returns agent capabilities, skills, and metadata |
| `/a2a/:agentId` | POST | JSON-RPC endpoint — accepts `message/send`, `tasks/get`, `tasks/cancel` |

**Agent Card example:**
```json
{
  "name": "Research Agent",
  "description": "Performs web research and summarization",
  "version": "1.0.0",
  "skills": [
    {
      "id": "web_research",
      "name": "Web Research",
      "description": "Search the web and compile findings"
    }
  ]
}
```

### A2A Client — Delegate to External Agents

CrewForm agents can delegate tasks to any external A2A-compliant agent using the built-in `a2a_delegate` tool.

**How to enable:**
1. Go to **Settings → A2A Protocol**
2. Enter the base URL of the external agent (e.g. `https://agent.example.com`)
3. Click **Discover** — CrewForm fetches the Agent Card and registers the agent
4. Toggle the agent to **Enabled**
5. Add `a2a_delegate` to any agent's tool list

The agent can then call:
```
a2a_delegate(agent_id: "remote-agent-uuid", message: "Research the latest AI trends")
```

## Authentication

A2A endpoints require a **Bearer token** matching an API key in your workspace:

```bash
curl -X POST https://your-task-runner/a2a/AGENT_ID \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"message/send","params":{"message":{"role":"user","parts":[{"text":"Hello"}]}},"id":"1"}'
```

## Managing Remote Agents

Navigate to **Settings → A2A Protocol** to:

- **Discover** — Register external agents by URL
- **Toggle** — Enable/disable remote agents
- **Refresh** — Update cached Agent Cards
- **Delete** — Remove remote agent registrations

## Database

A2A uses two tables:
- `a2a_remote_agents` — Registered external agents and cached Agent Cards
- `a2a_task_log` — Inbound and outbound A2A interaction history
