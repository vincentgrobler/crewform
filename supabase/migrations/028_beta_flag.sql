-- 028_beta_flag.sql
-- Add beta flag to workspaces for free unlimited usage

alter table public.workspaces
    add column if not exists is_beta boolean not null default false;

comment on column public.workspaces.is_beta is
    'Beta workspaces keep their plan tier but get unlimited resource usage for free.';
