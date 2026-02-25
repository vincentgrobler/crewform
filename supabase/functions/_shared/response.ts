// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { corsHeaders } from './cors.ts';

/** 200 OK with JSON body */
export function ok(data: unknown): Response {
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

/** 201 Created with JSON body */
export function created(data: unknown): Response {
    return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

/** 204 No Content */
export function noContent(): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

/** 400 Bad Request */
export function badRequest(message: string, details?: unknown): Response {
    return new Response(JSON.stringify({ error: message, details }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

/** 401 Unauthorized */
export function unauthorized(message: string): Response {
    return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

/** 404 Not Found */
export function notFound(resource: string): Response {
    return new Response(JSON.stringify({ error: `${resource} not found` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

/** 405 Method Not Allowed */
export function methodNotAllowed(): Response {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

/** 500 Internal Server Error */
export function serverError(message: string): Response {
    return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
