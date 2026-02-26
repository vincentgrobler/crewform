-- 021_webhooks.sql
-- Webhook / output route support for task notifications

-- ─── output_routes ───────────────────────────────────────────────────────────
create table if not exists public.output_routes (
    id          uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    name        text not null,
    destination_type text not null check (destination_type in ('http', 'slack', 'discord', 'telegram')),
    config      jsonb not null default '{}',
    events      text[] not null default array['task.completed', 'task.failed'],
    is_active   boolean not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index if not exists idx_output_routes_workspace on public.output_routes(workspace_id);

-- ─── webhook_logs ────────────────────────────────────────────────────────────
create table if not exists public.webhook_logs (
    id          uuid primary key default gen_random_uuid(),
    route_id    uuid not null references public.output_routes(id) on delete cascade,
    task_id     uuid not null references public.tasks(id) on delete cascade,
    event       text not null,
    status      text not null check (status in ('success', 'failed')),
    status_code int,
    error       text,
    payload     jsonb,
    created_at  timestamptz not null default now()
);

create index if not exists idx_webhook_logs_route on public.webhook_logs(route_id);
create index if not exists idx_webhook_logs_task on public.webhook_logs(task_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.output_routes enable row level security;
alter table public.webhook_logs enable row level security;

-- output_routes: workspace members can CRUD their own routes
create policy "Users can view own workspace routes"
    on public.output_routes for select
    using (workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
    ));

create policy "Users can insert own workspace routes"
    on public.output_routes for insert
    with check (workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
    ));

create policy "Users can update own workspace routes"
    on public.output_routes for update
    using (workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
    ));

create policy "Users can delete own workspace routes"
    on public.output_routes for delete
    using (workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
    ));

-- webhook_logs: read-only for workspace members
create policy "Users can view own workspace webhook logs"
    on public.webhook_logs for select
    using (route_id in (
        select id from public.output_routes where workspace_id in (
            select id from public.workspaces where owner_id = auth.uid()
        )
    ));

-- Task runner service role can insert logs
create policy "Service role can insert webhook logs"
    on public.webhook_logs for insert
    with check (true);

-- Task runner service role can read routes for dispatch
create policy "Service role can read routes"
    on public.output_routes for select
    using (true);

-- ─── Realtime ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.output_routes;
