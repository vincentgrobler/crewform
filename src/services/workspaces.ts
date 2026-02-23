// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from '@/lib/supabase'
import type { Workspace } from '@/types'

/**
 * Fetch all workspaces the current user is a member of.
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  const result = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  if (result.error) throw result.error
  return result.data as Workspace[]
}

/**
 * Fetch a single workspace by ID.
 */
export async function getWorkspace(id: string): Promise<Workspace> {
  const result = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

  if (result.error) throw result.error
  return result.data as Workspace
}

/**
 * Create a new workspace.
 */
export async function createWorkspace(
  input: Pick<Workspace, 'name' | 'slug'>,
): Promise<Workspace> {
  const authResult = await supabase.auth.getUser()
  const user = authResult.data.user
  if (!user) throw new Error('Not authenticated')

  const result = await supabase
    .from('workspaces')
    .insert({
      name: input.name,
      slug: input.slug,
      owner_id: user.id,
    })
    .select()
    .single()

  if (result.error) throw result.error
  return result.data as Workspace
}

/**
 * Update an existing workspace.
 */
export async function updateWorkspace(
  id: string,
  updates: Partial<Pick<Workspace, 'name' | 'slug' | 'settings'>>,
): Promise<Workspace> {
  const result = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (result.error) throw result.error
  return result.data as Workspace
}
