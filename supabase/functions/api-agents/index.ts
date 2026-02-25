// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { handleCors } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { ok, created, noContent, notFound, unauthorized, methodNotAllowed, serverError } from '../_shared/response.ts';
import { validateBody, z } from '../_shared/validate.ts';

const CreateAgentSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().default(''),
    model: z.string().min(1),
    system_prompt: z.string().default('You are a helpful AI assistant.'),
    temperature: z.number().min(0).max(2).default(0.7),
    tools: z.array(z.string()).default([]),
    status: z.enum(['idle', 'busy', 'offline']).default('idle'),
});

const UpdateAgentSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    model: z.string().min(1).optional(),
    system_prompt: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    tools: z.array(z.string()).optional(),
    status: z.enum(['idle', 'busy', 'offline']).optional(),
});

Deno.serve(async (req: Request) => {
    const cors = handleCors(req);
    if (cors) return cors;

    try {
        const auth = await authenticateRequest(req);
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        switch (req.method) {
            case 'GET': {
                if (id) {
                    // Get single agent
                    const { data, error } = await auth.supabaseClient
                        .from('agents')
                        .select('*')
                        .eq('id', id)
                        .eq('workspace_id', auth.workspaceId)
                        .single();

                    if (error || !data) return notFound('Agent');
                    return ok(data);
                }

                // List agents
                const { data, error } = await auth.supabaseClient
                    .from('agents')
                    .select('*')
                    .eq('workspace_id', auth.workspaceId)
                    .order('created_at', { ascending: false });

                if (error) return serverError(error.message);
                return ok(data);
            }

            case 'POST': {
                const result = await validateBody(req, CreateAgentSchema);
                if ('error' in result) return result.error;

                const { data, error } = await auth.supabaseClient
                    .from('agents')
                    .insert({ ...result.data, workspace_id: auth.workspaceId })
                    .select()
                    .single();

                if (error) return serverError(error.message);
                return created(data);
            }

            case 'PATCH': {
                if (!id) return notFound('Agent (missing id parameter)');

                const result = await validateBody(req, UpdateAgentSchema);
                if ('error' in result) return result.error;

                const { data, error } = await auth.supabaseClient
                    .from('agents')
                    .update(result.data)
                    .eq('id', id)
                    .eq('workspace_id', auth.workspaceId)
                    .select()
                    .single();

                if (error) return serverError(error.message);
                if (!data) return notFound('Agent');
                return ok(data);
            }

            case 'DELETE': {
                if (!id) return notFound('Agent (missing id parameter)');

                const { error } = await auth.supabaseClient
                    .from('agents')
                    .delete()
                    .eq('id', id)
                    .eq('workspace_id', auth.workspaceId);

                if (error) return serverError(error.message);
                return noContent();
            }

            default:
                return methodNotAllowed();
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('authentication') || message.includes('JWT') || message.includes('API key') || message.includes('Invalid')) {
            return unauthorized(message);
        }
        return serverError(message);
    }
});
