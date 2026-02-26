-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Copyright (C) 2026 CrewForm
--
-- 019_provider_active_flag.sql — Add is_active flag to api_keys for provider toggling

ALTER TABLE public.api_keys
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.api_keys.is_active IS
  'Whether the provider is actively enabled for use in agent model selection';
