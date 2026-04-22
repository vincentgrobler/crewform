-- 077_trial_support.sql — 7-day Team trial for new workspaces
--
-- Adds trial_expires_at column to workspaces and a trigger that
-- automatically sets a 7-day trial on workspace creation.
-- Plan resolution should check: trial_expires_at > NOW() → 'team' tier.

-- ─── Column ─────────────────────────────────────────────────────────────────

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.workspaces.trial_expires_at IS
  'When set, the workspace receives Team-tier access until this timestamp. NULL = no trial.';

-- ─── Index for efficient trial queries ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_workspaces_trial_expires
  ON public.workspaces (trial_expires_at)
  WHERE trial_expires_at IS NOT NULL;

-- ─── Auto-set trial on new workspace creation ──────────────────────────────

CREATE OR REPLACE FUNCTION public.set_trial_on_workspace_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set trial if not explicitly provided (e.g. admin-created workspaces)
  IF NEW.trial_expires_at IS NULL AND NEW.plan = 'free' THEN
    NEW.trial_expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS trg_set_workspace_trial ON public.workspaces;

CREATE TRIGGER trg_set_workspace_trial
  BEFORE INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_on_workspace_create();
