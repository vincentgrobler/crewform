-- 027_marketplace_submissions.sql
-- Marketplace submission/review workflow for community publishing

create table if not exists public.marketplace_submissions (
    id                      uuid primary key default gen_random_uuid(),
    agent_id                uuid not null references public.agents(id) on delete cascade,
    submitted_by            uuid not null references auth.users(id) on delete cascade,
    status                  text not null default 'pending'
                              check (status in ('pending', 'approved', 'rejected')),
    review_notes            text,
    injection_scan_result   jsonb not null default '{}'::jsonb,
    reviewed_by             uuid references auth.users(id) on delete set null,
    reviewed_at             timestamptz,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index if not exists idx_submissions_status
    on public.marketplace_submissions(status);

create index if not exists idx_submissions_agent
    on public.marketplace_submissions(agent_id);

create index if not exists idx_submissions_user
    on public.marketplace_submissions(submitted_by);

create trigger trg_submissions_updated_at
    before update on public.marketplace_submissions
    for each row execute function public.update_updated_at();

alter table public.marketplace_submissions enable row level security;

-- Agent owners can read their own submissions
create policy "submissions_select_own"
    on public.marketplace_submissions for select
    using (submitted_by = (select auth.uid()));

-- Super admins can read all submissions
create policy "submissions_select_admin"
    on public.marketplace_submissions for select
    using (public.is_super_admin());

-- Agent owners can insert (submit for review)
create policy "submissions_insert"
    on public.marketplace_submissions for insert
    with check (submitted_by = (select auth.uid()));

-- Super admins can update (approve/reject)
create policy "submissions_update_admin"
    on public.marketplace_submissions for update
    using (public.is_super_admin());
