-- Custom tool definitions
-- Allows users to define their own tools with JSON Schema parameters
-- and webhook endpoints for execution.

CREATE TABLE IF NOT EXISTS custom_tools (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    parameters  JSONB NOT NULL DEFAULT '{"properties":{},"required":[]}',
    webhook_url TEXT NOT NULL,
    webhook_headers JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(workspace_id, name)
);

-- Enable RLS
ALTER TABLE custom_tools ENABLE ROW LEVEL SECURITY;

-- Workspace members can read their own tools
CREATE POLICY "custom_tools_select"
    ON custom_tools FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Workspace members can insert tools
CREATE POLICY "custom_tools_insert"
    ON custom_tools FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Workspace members can update their own tools
CREATE POLICY "custom_tools_update"
    ON custom_tools FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Workspace members can delete their own tools
CREATE POLICY "custom_tools_delete"
    ON custom_tools FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_custom_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_tools_updated_at
    BEFORE UPDATE ON custom_tools
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_tools_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE custom_tools;
