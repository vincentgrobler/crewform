-- 070_agent_marketplace_readme.sql
-- Add a markdown README field for marketplace agents.
-- Creators can write documentation that appears on the agent detail modal.

ALTER TABLE agents ADD COLUMN IF NOT EXISTS marketplace_readme TEXT;

COMMENT ON COLUMN agents.marketplace_readme IS 'Markdown content displayed on the marketplace agent detail page. Supports headings, lists, code blocks, etc.';
