-- 023_task_scheduled_for.sql
-- Add scheduled_for date to tasks for calendar view

alter table public.tasks
    add column if not exists scheduled_for timestamptz;

create index if not exists idx_tasks_scheduled
    on public.tasks(workspace_id, scheduled_for)
    where scheduled_for is not null;
