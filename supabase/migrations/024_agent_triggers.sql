-- 024_agent_triggers.sql
-- Proactive agent triggers: CRON, webhook, manual

-- ─── Triggers table ──────────────────────────────────────────────────────────

create table if not exists public.agent_triggers (
    id                          uuid primary key default gen_random_uuid(),
    agent_id                    uuid not null references public.agents(id) on delete cascade,
    workspace_id                uuid not null references public.workspaces(id) on delete cascade,
    trigger_type                text not null check (trigger_type in ('cron', 'webhook', 'manual')),
    cron_expression             text,           -- e.g. '0 9 * * *' (daily 9am)
    webhook_token               text,           -- unique token for webhook URL
    task_title_template         text not null,   -- e.g. 'Daily report for {{date}}'
    task_description_template   text not null default '',
    enabled                     boolean not null default true,
    last_fired_at               timestamptz,
    created_at                  timestamptz not null default now()
);

create index if not exists idx_triggers_agent_enabled
    on public.agent_triggers(agent_id, enabled);

create index if not exists idx_triggers_workspace
    on public.agent_triggers(workspace_id);

-- ─── Trigger log ─────────────────────────────────────────────────────────────

create table if not exists public.trigger_log (
    id          uuid primary key default gen_random_uuid(),
    trigger_id  uuid not null references public.agent_triggers(id) on delete cascade,
    task_id     uuid references public.tasks(id) on delete set null,
    fired_at    timestamptz not null default now(),
    status      text not null default 'fired' check (status in ('fired', 'failed')),
    error       text
);

create index if not exists idx_trigger_log_trigger
    on public.trigger_log(trigger_id, fired_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.agent_triggers enable row level security;
alter table public.trigger_log enable row level security;

create policy "Users can manage triggers for own workspace"
    on public.agent_triggers for all
    using (workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
    ))
    with check (workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
    ));

create policy "Users can view trigger logs for own workspace"
    on public.trigger_log for select
    using (trigger_id in (
        select id from public.agent_triggers where workspace_id in (
            select id from public.workspaces where owner_id = auth.uid()
        )
    ));
