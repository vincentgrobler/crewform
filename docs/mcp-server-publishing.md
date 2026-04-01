---
title: 'MCP Server Publishing'
description: 'Expose your CrewForm agents as MCP tools for Claude Desktop, Cursor, and other MCP clients'
---

## Overview

CrewForm can act as an **MCP Server**, exposing your agents as tools that any MCP-compatible client can discover and call. This means Claude Desktop, Cursor, other AI frameworks, or custom integrations can use your CrewForm agents as tools — without writing a single line of code.

<Info>This is the **reverse** of MCP Client support. MCP Client lets your agents *use* external tools. MCP Server Publishing lets *external clients* use your agents as tools.</Info>

```
External MCP Client  →  POST /mcp  →  Task Runner  →  Agent Execution
(Claude Desktop,         JSON-RPC       Auth +           Create task,
 Cursor, etc.)           Protocol       Routing          poll for result
```

## Quick Start

### 1. Generate an MCP API Key

1. Go to **Settings → MCP Servers**
2. Scroll to **MCP Server Publishing**
3. Click **Generate MCP API Key**
4. Copy the key — it's only shown once

### 2. Publish Your Agents

1. Open any agent's detail page
2. Click the **MCP Publish** button in the toolbar
3. The agent now appears as an MCP tool

### 3. Connect Your Client

In the **MCP Server Publishing** section of Settings, you'll see an auto-generated config snippet. Copy it into your client:

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "crewform": {
      "url": "https://runner.crewform.tech/mcp",
      "headers": {
        "Authorization": "Bearer cf_mcp_your_key_here"
      }
    }
  }
}
```

**Cursor** (Settings → MCP):

Add a new MCP server with your endpoint URL and Bearer token auth header.

## How It Works

When an MCP client connects to your CrewForm `/mcp` endpoint:

1. **`initialize`** — Client establishes a session. CrewForm returns its server capabilities and protocol version.
2. **`tools/list`** — Client discovers available tools. Each MCP-published agent becomes a tool with:
   - **name** — Derived from agent name (lowercase, underscored, max 64 chars)
   - **description** — The agent's description
   - **inputSchema** — `{ message: string }` — the prompt to send to the agent
3. **`tools/call`** — Client invokes a tool. CrewForm creates a task, assigns it to the agent, and polls for completion. The agent's output is returned as the tool result.

## Authentication

MCP Server requests are authenticated via **Bearer tokens**:

```
Authorization: Bearer cf_mcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The server accepts two types of API keys:
- **MCP Server keys** (`provider: 'mcp-server'`) — Dedicated keys generated from the UI
- **A2A keys** (`provider: 'a2a'`) — Existing A2A API keys also work as a fallback

Each key is scoped to a workspace. Only agents in that workspace are exposed.

## Managing API Keys

| Action | How |
|---|---|
| **Generate** | Settings → MCP Servers → MCP Server Publishing → Generate MCP API Key |
| **Regenerate** | Click "Regenerate" next to the existing key (invalidates the old one) |
| **Revoke** | Click "Revoke" to delete the key entirely |

<Warning>Regenerating or revoking a key immediately invalidates it. All connected MCP clients will need to be updated with the new key.</Warning>

## Published Agent List

The **MCP Server Publishing** section in Settings shows all agents currently exposed as MCP tools, including their tool names. This lets you verify exactly what external clients will see when they call `tools/list`.

## Transport

CrewForm's MCP Server uses **Streamable HTTP** transport:

- **Endpoint:** `POST /mcp`
- **Content-Type:** `application/json`
- **Protocol:** JSON-RPC 2.0
- **Methods:** `initialize`, `notifications/initialized`, `tools/list`, `tools/call`, `ping`

## Self-Hosting

When self-hosting, your MCP endpoint is your task runner URL + `/mcp`:

```
https://your-task-runner-host:3001/mcp
```

Set `VITE_TASK_RUNNER_URL` in your frontend environment to have the config snippet auto-populate with the correct URL.

## Security Considerations

- Only agents explicitly marked as `is_mcp_published = true` are exposed
- All requests require a valid Bearer token
- Keys are workspace-scoped — one workspace's key cannot access another's agents
- Each tool call creates a full task record with audit trail
- Rate limiting is inherited from your task runner configuration
