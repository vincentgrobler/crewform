# REST API Reference

CrewForm exposes a REST API via Supabase for programmatic access to your workspace. Authenticate using API keys created in **Settings → API Keys**.

## Authentication

All API requests require a REST API key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer crfm_your_api_key" \
     -H "Content-Type: application/json" \
     https://your-project.supabase.co/rest/v1/agents
```

### Creating API Keys

1. Go to **Settings → API Keys**
2. Click **Generate Key**
3. Copy the key — it's only shown once
4. The key is hashed (SHA-256) before storage for security

## Endpoints

All endpoints are accessed via the Supabase REST API at:

```
https://<your-project>.supabase.co/rest/v1/<table>
```

You also need the `apikey` header with your Supabase anon key:

```bash
curl -H "Authorization: Bearer crfm_your_api_key" \
     -H "apikey: your-supabase-anon-key" \
     https://your-project.supabase.co/rest/v1/agents
```

---

## Agents

### List Agents

```http
GET /rest/v1/agents?select=*
```

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Code Reviewer",
    "description": "Reviews code for bugs and best practices",
    "model": "claude-sonnet-4-20250514",
    "provider": "anthropic",
    "system_prompt": "You are a senior code reviewer...",
    "temperature": 0.3,
    "max_tokens": 4096,
    "tags": ["code", "review"],
    "workspace_id": "uuid",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z"
  }
]
```

### Create Agent

```http
POST /rest/v1/agents
Content-Type: application/json

{
  "name": "Code Reviewer",
  "model": "claude-sonnet-4-20250514",
  "provider": "anthropic",
  "system_prompt": "You are a senior code reviewer...",
  "workspace_id": "your-workspace-id"
}
```

### Update Agent

```http
PATCH /rest/v1/agents?id=eq.{agent_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "temperature": 0.5
}
```

### Delete Agent

```http
DELETE /rest/v1/agents?id=eq.{agent_id}
```

---

## Tasks

### List Tasks

```http
GET /rest/v1/tasks?select=*&order=created_at.desc
```

**Query parameters for filtering:**

| Parameter | Example | Description |
|-----------|---------|-------------|
| `status` | `eq.running` | Filter by status |
| `priority` | `eq.high` | Filter by priority |
| `agent_id` | `eq.{uuid}` | Filter by assigned agent |

### Create Task

```http
POST /rest/v1/tasks
Content-Type: application/json

{
  "title": "Review PR #42",
  "description": "Review the authentication changes",
  "agent_id": "uuid",
  "priority": "high",
  "workspace_id": "your-workspace-id"
}
```

**Task statuses:** `pending`, `running`, `completed`, `failed`, `cancelled`

**Task priorities:** `low`, `medium`, `high`, `critical`

### Get Task Detail

```http
GET /rest/v1/tasks?id=eq.{task_id}&select=*
```

---

## Teams

### List Teams

```http
GET /rest/v1/teams?select=*
```

### Create Team

```http
POST /rest/v1/teams
Content-Type: application/json

{
  "name": "Content Pipeline",
  "description": "Research → Write → Edit",
  "mode": "pipeline",
  "workspace_id": "your-workspace-id"
}
```

### Team Runs

```http
GET /rest/v1/team_runs?team_id=eq.{team_id}&select=*&order=created_at.desc
```

---

## Usage Records

### Query Usage

```http
GET /rest/v1/usage_records?select=*&created_at=gte.2026-01-01&order=created_at.desc
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | uuid | Associated task |
| `agent_id` | uuid | Agent that ran |
| `provider` | string | LLM provider |
| `model` | string | Model used |
| `prompt_tokens` | integer | Input tokens |
| `completion_tokens` | integer | Output tokens |
| `estimated_cost_usd` | decimal | Estimated cost |
| `billing_model` | string | `per-token` or `subscription-quota` |

---

## Marketplace

### Browse Agents

```http
GET /rest/v1/agents?is_marketplace=eq.true&select=*
```

### Install Agent (RPC)

```http
POST /rest/v1/rpc/increment_install_count
Content-Type: application/json

{
  "agent_row_id": "uuid"
}
```

---

## Rate Limits

The Supabase free tier includes:
- **500 requests/minute** per API key
- **50,000 requests/month** total

For higher limits, upgrade your Supabase plan.

## Error Handling

All errors follow the standard Supabase/PostgREST format:

```json
{
  "code": "PGRST301",
  "message": "Row not found",
  "details": null,
  "hint": null
}
```

Common error codes:

| HTTP Status | Meaning |
|-------------|---------|
| `401` | Missing or invalid API key |
| `403` | Row-Level Security denied access |
| `404` | Resource not found |
| `409` | Conflict (duplicate key) |
| `422` | Validation error |
