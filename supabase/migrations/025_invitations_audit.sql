-- 025_invitations_audit.sql
-- Workspace invitations + audit log for multi-user RBAC

-- ─── Workspace Invitations ───────────────────────────────────────────────────

create table if not exists public.workspace_invitations (
    id              uuid primary key default gen_random_uuid(),
    workspace_id    uuid not null references public.workspaces(id) on delete cascade,
    email           text not null,
    role            text not null default 'member'
                      check (role in ('admin', 'manager', 'member', 'viewer')),
    token           text not null unique default encode(gen_random_bytes(32), 'hex'),
    invited_by      uuid not null references auth.users(id) on delete cascade,
    status          text not null default 'pending'
                      check (status in ('pending', 'accepted', 'expired')),
    expires_at      timestamptz not null default (now() + interval '7 days'),
    created_at      timestamptz not null default now()
);

create index if not exists idx_invitations_workspace
    on public.workspace_invitations(workspace_id, status);

create index if not exists idx_invitations_email
    on public.workspace_invitations(email, status);

create index if not exists idx_invitations_token
    on public.workspace_invitations(token);

-- ─── Audit Log ───────────────────────────────────────────────────────────────

create table if not exists public.audit_log (
    id              uuid primary key default gen_random_uuid(),
    workspace_id    uuid not null references public.workspaces(id) on delete cascade,
    user_id         uuid references auth.users(id) on delete set null,
    action          text not null,
    details         jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index if not exists idx_audit_log_workspace
    on public.audit_log(workspace_id, created_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.workspace_invitations enable row level security;
alter table public.audit_log enable row level security;

-- Admins+ can manage invitations in their workspace
create policy "invitations_select"
    on public.workspace_invitations for select
    using (public.is_workspace_member(workspace_id));

create policy "invitations_insert"
    on public.workspace_invitations for insert
    with check (public.get_workspace_role(workspace_id) in ('owner', 'admin'));

create policy "invitations_update"
    on public.workspace_invitations for update
    using (public.get_workspace_role(workspace_id) in ('owner', 'admin'));

create policy "invitations_delete"
    on public.workspace_invitations for delete
    using (public.get_workspace_role(workspace_id) in ('owner', 'admin'));

-- All workspace members can read audit log
create policy "audit_log_select"
    on public.audit_log for select
    using (public.is_workspace_member(workspace_id));

-- Only system/admins insert audit entries (via service role or admin)
create policy "audit_log_insert"
    on public.audit_log for insert
    with check (public.is_workspace_member(workspace_id));

-- ─── Accept Invitation Function ─────────────────────────────────────────────
-- Allows any authenticated user to accept an invitation by token

create or replace function public.accept_invitation(invite_token text)
returns json as $$
declare
    inv record;
begin
    -- Find the invitation
    select * into inv
    from public.workspace_invitations
    where token = invite_token
      and status = 'pending'
      and expires_at > now();

    if inv is null then
        return json_build_object('success', false, 'error', 'Invalid or expired invitation');
    end if;

    -- Add user to workspace
    insert into public.workspace_members (workspace_id, user_id, role)
    values (inv.workspace_id, auth.uid(), inv.role)
    on conflict (workspace_id, user_id) do nothing;

    -- Mark invitation as accepted
    update public.workspace_invitations
    set status = 'accepted'
    where id = inv.id;

    -- Log the event
    insert into public.audit_log (workspace_id, user_id, action, details)
    values (
        inv.workspace_id,
        auth.uid(),
        'member_joined',
        json_build_object('email', inv.email, 'role', inv.role, 'invitation_id', inv.id)::jsonb
    );

    return json_build_object('success', true, 'workspace_id', inv.workspace_id);
end;
$$ language plpgsql security definer;
