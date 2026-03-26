// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from '@/lib/supabase'

export interface McpServer {
    id: string
    workspace_id: string
    name: string
    description: string
    url: string
    transport: 'streamable-http' | 'sse' | 'stdio'
    config: Record<string, unknown>
    is_enabled: boolean
    tools_cache: Array<{ name: string; description?: string }>
    created_at: string
    updated_at: string
}

export interface CreateMcpServerInput {
    workspace_id: string
    name: string
    description?: string
    url: string
    transport: 'streamable-http' | 'sse' | 'stdio'
    config?: Record<string, unknown>
}

export interface UpdateMcpServerInput {
    name?: string
    description?: string
    url?: string
    transport?: 'streamable-http' | 'sse' | 'stdio'
    config?: Record<string, unknown>
    is_enabled?: boolean
    tools_cache?: Array<{ name: string; description?: string }>
}

/** Fetch all MCP servers for a workspace */
export async function fetchMcpServers(workspaceId: string): Promise<McpServer[]> {
    const { data, error } = await supabase
        .from('mcp_servers')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })

    if (error) throw error
    return data as McpServer[]
}

/** Create a new MCP server */
export async function createMcpServer(input: CreateMcpServerInput): Promise<McpServer> {
    const result = await supabase
        .from('mcp_servers')
        .insert(input)
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as unknown as McpServer
}

/** Update an MCP server */
export async function updateMcpServer(id: string, input: UpdateMcpServerInput): Promise<McpServer> {
    const result = await supabase
        .from('mcp_servers')
        .update(input)
        .eq('id', id)
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as unknown as McpServer
}

/** Delete an MCP server */
export async function deleteMcpServer(id: string): Promise<void> {
    const { error } = await supabase
        .from('mcp_servers')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ─── MCP Tool Discovery (client-side JSON-RPC) ──────────────────────────────

interface McpJsonRpcResponse {
    jsonrpc: '2.0'
    id: number
    result?: { tools?: Array<{ name: string; description?: string; inputSchema?: unknown }> }
    error?: { code: number; message: string }
}

/**
 * Discover tools from an MCP server using Streamable HTTP transport.
 * Sends JSON-RPC initialize + tools/list to the server URL,
 * then saves the result to tools_cache in the database.
 */
export async function discoverMcpTools(
    server: McpServer,
): Promise<Array<{ name: string; description?: string }>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
    }

    // Add any auth headers from server config
    const configHeaders = server.config.headers as Record<string, string> | undefined
    if (configHeaders) {
        Object.assign(headers, configHeaders)
    }

    // 1. Initialize the MCP connection
    const initResponse = await fetch(server.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2025-03-26',
                capabilities: {},
                clientInfo: { name: 'crewform', version: '1.0.0' },
            },
        }),
    })

    if (!initResponse.ok) {
        throw new Error(`MCP server returned ${String(initResponse.status)}: ${await initResponse.text()}`)
    }

    // Capture session ID from response headers if present (for stateful servers)
    const sessionId = initResponse.headers.get('mcp-session-id')
    if (sessionId) {
        headers['mcp-session-id'] = sessionId
    }

    // Handle response — could be JSON or SSE
    const initContentType = initResponse.headers.get('content-type') ?? ''
    if (initContentType.includes('text/event-stream')) {
        // Parse SSE response to extract the JSON-RPC result
        const sseText = await initResponse.text()
        const jsonMatch = /^data: (.+)$/m.exec(sseText)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]) as McpJsonRpcResponse
            if (parsed.error) {
                throw new Error(`MCP initialize failed: ${parsed.error.message}`)
            }
        }
    } else {
        const initResult = await initResponse.json() as McpJsonRpcResponse
        if (initResult.error) {
            throw new Error(`MCP initialize failed: ${initResult.error.message}`)
        }
    }

    // 2. Send initialized notification
    void fetch(server.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
        }),
    })

    // 3. List available tools
    const toolsResponse = await fetch(server.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {},
        }),
    })

    if (!toolsResponse.ok) {
        throw new Error(`tools/list failed: HTTP ${String(toolsResponse.status)}`)
    }

    let tools: Array<{ name: string; description?: string }> = []

    const toolsContentType = toolsResponse.headers.get('content-type') ?? ''
    if (toolsContentType.includes('text/event-stream')) {
        const sseText = await toolsResponse.text()
        const jsonMatch = /^data: (.+)$/m.exec(sseText)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]) as McpJsonRpcResponse
            if (parsed.error) {
                throw new Error(`tools/list failed: ${parsed.error.message}`)
            }
            tools = (parsed.result?.tools ?? []).map((t) => ({
                name: t.name,
                description: t.description,
            }))
        }
    } else {
        const toolsResult = await toolsResponse.json() as McpJsonRpcResponse
        if (toolsResult.error) {
            throw new Error(`tools/list failed: ${toolsResult.error.message}`)
        }
        tools = (toolsResult.result?.tools ?? []).map((t) => ({
            name: t.name,
            description: t.description,
        }))
    }

    // 4. Save to tools_cache
    await updateMcpServer(server.id, { tools_cache: tools })

    return tools
}
