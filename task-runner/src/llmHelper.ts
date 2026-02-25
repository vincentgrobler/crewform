// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm
//
// Shared LLM execution helper — used by both pipeline and orchestrator executors.

import { supabase } from './supabase';
import { executeAnthropic } from './providers/anthropic';
import { executeOpenAI } from './providers/openai';
import { executeGoogle } from './providers/google';
import { decryptApiKey } from './crypto';
import type { Agent, ApiKey, TokenUsage } from './types';

export interface LLMCallInput {
    workspaceId: string;
    agentId: string;
    systemPrompt: string;
    userPrompt: string;
    onStream?: (text: string) => Promise<void> | void;
}

export interface LLMCallResult {
    result: string;
    usage: TokenUsage;
    provider: string;
    model: string;
}

/**
 * Execute an LLM call for a given agent, handling key decryption and provider routing.
 * Shared between pipeline steps and orchestrator delegations.
 */
export async function executeLLMCall(input: LLMCallInput): Promise<LLMCallResult> {
    // 1. Fetch agent
    const agentResponse = await supabase
        .from('agents')
        .select('*')
        .eq('id', input.agentId)
        .single();

    const agent = agentResponse.data as Agent | null;
    if (agentResponse.error || !agent) {
        throw new Error(`Failed to load agent ${input.agentId}: ${agentResponse.error?.message ?? 'not found'}`);
    }

    // 2. Fetch API key
    const keyResponse = await supabase
        .from('api_keys')
        .select('*')
        .eq('workspace_id', input.workspaceId)
        .eq('provider', agent.provider)
        .single();

    const apiKeyData = keyResponse.data as ApiKey | null;
    if (keyResponse.error || !apiKeyData) {
        throw new Error(`No API key for provider ${agent.provider}. Configure it in Settings.`);
    }

    const rawKey = decryptApiKey(apiKeyData.encrypted_key);

    // 3. Route to provider
    const provider = agent.provider.toLowerCase();
    const rawStreamFn = input.onStream;
    const streamFn = async (text: string): Promise<void> => {
        if (rawStreamFn) await rawStreamFn(text);
    };

    let executionResult: { result: string; usage: TokenUsage };

    if (provider === 'anthropic') {
        executionResult = await executeAnthropic(rawKey, agent.model, input.systemPrompt, input.userPrompt, streamFn);
    } else if (provider === 'openai') {
        executionResult = await executeOpenAI(rawKey, agent.model, input.systemPrompt, input.userPrompt, streamFn);
    } else if (provider === 'google') {
        executionResult = await executeGoogle(rawKey, agent.model, input.systemPrompt, input.userPrompt, streamFn);
    } else {
        throw new Error(`Provider "${provider}" is not yet supported.`);
    }

    return {
        result: executionResult.result,
        usage: executionResult.usage,
        provider: agent.provider,
        model: agent.model,
    };
}
