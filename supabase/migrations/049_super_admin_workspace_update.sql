-- 049_super_admin_workspace_update.sql
-- Fix: Super admins could not UPDATE workspaces they don't own.
-- The original 026_billing_admin.sql only added a SELECT policy for super admins.
-- This migration adds UPDATE policy so super admins can toggle beta, override plans, etc.

-- Allow super admins to update any workspace (e.g. toggle is_beta, change plan)
CREATE POLICY "super_admin_workspaces_update"
    ON public.workspaces FOR UPDATE
    USING (public.is_super_admin());
