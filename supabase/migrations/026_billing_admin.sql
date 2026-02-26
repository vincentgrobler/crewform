-- 026_billing_admin.sql
-- Stripe billing tables, plan limits, and super admin support

-- ─── Super Admins ────────────────────────────────────────────────────────────

create table if not exists public.super_admins (
    user_id     uuid primary key references auth.users(id) on delete cascade,
    created_at  timestamptz not null default now()
);

alter table public.super_admins enable row level security;

-- Super admins can read their own record
create policy "super_admins_select"
    on public.super_admins for select
    using (user_id = (select auth.uid()));

-- Helper function to check if user is a super admin
create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.super_admins
    where user_id = (select auth.uid())
  );
$$ language sql security definer stable;

-- ─── Subscriptions ───────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
    id                      uuid primary key default gen_random_uuid(),
    workspace_id            uuid not null references public.workspaces(id) on delete cascade,
    stripe_customer_id      text,
    stripe_subscription_id  text,
    plan                    text not null default 'free'
                              check (plan in ('free', 'pro', 'team', 'enterprise')),
    status                  text not null default 'active'
                              check (status in ('active', 'past_due', 'cancelled', 'trialing', 'incomplete')),
    current_period_start    timestamptz,
    current_period_end      timestamptz,
    cancel_at_period_end    boolean not null default false,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    unique (workspace_id)
);

create index if not exists idx_subscriptions_workspace
    on public.subscriptions(workspace_id);

create index if not exists idx_subscriptions_stripe_customer
    on public.subscriptions(stripe_customer_id);

create trigger trg_subscriptions_updated_at
    before update on public.subscriptions
    for each row execute function public.update_updated_at();

alter table public.subscriptions enable row level security;

-- Workspace members can read their subscription
create policy "subscriptions_select"
    on public.subscriptions for select
    using (public.is_workspace_member(workspace_id) or public.is_super_admin());

-- Only admins+ can update (or super admins)
create policy "subscriptions_update"
    on public.subscriptions for update
    using (
        public.get_workspace_role(workspace_id) in ('owner', 'admin')
        or public.is_super_admin()
    );

-- Auto-insert on workspace creation not needed — we default to 'free'
create policy "subscriptions_insert"
    on public.subscriptions for insert
    with check (
        public.get_workspace_role(workspace_id) in ('owner', 'admin')
        or public.is_super_admin()
    );

-- ─── Plan Limits Config ─────────────────────────────────────────────────────
-- Immutable reference table for quota enforcement

create table if not exists public.plan_limits (
    plan        text not null,
    resource    text not null,
    max_value   integer not null, -- -1 = unlimited
    primary key (plan, resource)
);

alter table public.plan_limits enable row level security;

-- Everyone can read plan limits
create policy "plan_limits_select"
    on public.plan_limits for select
    using (true);

-- Only super admins can modify
create policy "plan_limits_modify"
    on public.plan_limits for all
    using (public.is_super_admin());

-- Seed the limits
insert into public.plan_limits (plan, resource, max_value) values
    -- Free tier
    ('free', 'agents', 3),
    ('free', 'tasks_per_month', 50),
    ('free', 'teams', 1),
    ('free', 'members', 1),
    ('free', 'triggers', 1),
    ('free', 'marketplace_installs', 3),
    ('free', 'csv_export', 0),       -- 0 = disabled
    ('free', 'audit_log_days', 0),
    ('free', 'orchestrator', 0),
    -- Pro tier
    ('pro', 'agents', 25),
    ('pro', 'tasks_per_month', 1000),
    ('pro', 'teams', 10),
    ('pro', 'members', 3),
    ('pro', 'triggers', 10),
    ('pro', 'marketplace_installs', -1),
    ('pro', 'csv_export', 1),        -- 1 = enabled
    ('pro', 'audit_log_days', 7),
    ('pro', 'orchestrator', 1),
    -- Team tier
    ('team', 'agents', -1),
    ('team', 'tasks_per_month', -1),
    ('team', 'teams', -1),
    ('team', 'members', 25),
    ('team', 'triggers', -1),
    ('team', 'marketplace_installs', -1),
    ('team', 'csv_export', 1),
    ('team', 'audit_log_days', -1),
    ('team', 'orchestrator', 1),
    -- Enterprise tier
    ('enterprise', 'agents', -1),
    ('enterprise', 'tasks_per_month', -1),
    ('enterprise', 'teams', -1),
    ('enterprise', 'members', -1),
    ('enterprise', 'triggers', -1),
    ('enterprise', 'marketplace_installs', -1),
    ('enterprise', 'csv_export', 1),
    ('enterprise', 'audit_log_days', -1),
    ('enterprise', 'orchestrator', 1)
on conflict do nothing;

-- ─── Auto-create free subscription on workspace creation ─────────────────────

create or replace function public.auto_create_subscription()
returns trigger as $$
begin
    insert into public.subscriptions (workspace_id, plan, status)
    values (NEW.id, 'free', 'active')
    on conflict (workspace_id) do nothing;
    return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_auto_subscription
    after insert on public.workspaces
    for each row execute function public.auto_create_subscription();

-- ─── Super Admin RLS override policies ──────────────────────────────────────
-- Allow super admins to read all workspaces and workspace_members

create policy "super_admin_workspaces_select"
    on public.workspaces for select
    using (public.is_super_admin());

create policy "super_admin_members_select"
    on public.workspace_members for select
    using (public.is_super_admin());
