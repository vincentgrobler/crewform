-- 055_trigger_context_options.sql
-- Add context_options to agent_triggers for CRON data enrichment.
-- Allows triggers to optionally inject workspace data into task descriptions.

ALTER TABLE public.agent_triggers
    ADD COLUMN IF NOT EXISTS context_options JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.agent_triggers.context_options IS
    'Array of data source keys to inject into task descriptions, e.g. ["task_summary", "team_activity", "agent_usage"]';
