-- 022_prompt_history.sql
-- Prompt version history for agents

create table if not exists public.agent_prompt_history (
    id          uuid primary key default gen_random_uuid(),
    agent_id    uuid not null references public.agents(id) on delete cascade,
    version     int not null,
    system_prompt text not null,
    model       text,
    temperature double precision,
    changed_at  timestamptz not null default now()
);

-- Unique version per agent
create unique index if not exists idx_prompt_history_agent_version
    on public.agent_prompt_history(agent_id, version);

create index if not exists idx_prompt_history_agent
    on public.agent_prompt_history(agent_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.agent_prompt_history enable row level security;

create policy "Users can view prompt history for own agents"
    on public.agent_prompt_history for select
    using (agent_id in (
        select id from public.agents where workspace_id in (
            select id from public.workspaces where owner_id = auth.uid()
        )
    ));

create policy "Users can insert prompt history for own agents"
    on public.agent_prompt_history for insert
    with check (agent_id in (
        select id from public.agents where workspace_id in (
            select id from public.workspaces where owner_id = auth.uid()
        )
    ));
