-- 052_admin_agents_read_policy.sql
-- Allow super admins to read agents from any workspace.
-- Required for the Review Queue to fetch submitted agent data cross-workspace.

CREATE POLICY "agents_select_admin" ON public.agents
  FOR SELECT USING (public.is_super_admin());
