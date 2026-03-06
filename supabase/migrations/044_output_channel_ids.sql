-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Copyright (C) 2026 CrewForm
--
-- 044_output_channel_ids.sql — Add output channel selector to agents and teams
--
-- NULL  = broadcast to ALL active messaging channels (default, backwards-compatible)
-- []    = broadcast to no channels
-- [id1] = broadcast only to specified channel(s)

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS output_channel_ids UUID[];

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS output_channel_ids UUID[];
