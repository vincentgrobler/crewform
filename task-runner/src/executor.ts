import { supabase } from './supabase';
import { executeAnthropic } from './providers/anthropic';
import { executeOpenAI } from './providers/openai';
import { executeGoogle } from './providers/google';
import { decryptApiKey } from './crypto';
import { writeTaskUsageRecord } from './usageWriter';
import type { Task, Agent, ApiKey } from './types';

interface AgentTaskRecord {
    id: string;
    status: string;
}

/**
 * Derive provider from model name when agent.provider is null.
 * Maps well-known model prefixes to their provider.
 */
function inferProvider(model: string): string | null {
    const m = model.toLowerCase();
    if (m.includes('claude')) return 'anthropic';
    if (m.includes('gpt') || m.includes('o1') || m.includes('o3')) return 'openai';
    if (m.includes('gemini')) return 'google';
    if (m.startsWith('groq/')) return 'groq';
    if (m.startsWith('openrouter/')) return 'openrouter';
    if (m.includes('mistral') || m.includes('codestral')) return 'mistral';
    if (m.includes('command-r')) return 'cohere';
    return null;
}

export async function processTask(task: Task) {
    // Find the auto-created agent_tasks record (created by DB trigger on dispatch)
    let agentTaskId: string | null = null;

    try {
        console.log(`[TaskRunner] Claimed task ${task.id} (Agent: ${task.assigned_agent_id})`);

        if (!task.assigned_agent_id) {
            throw new Error('Task has no assigned agent.');
        }

        // 0. Fetch the auto-dispatched agent_tasks record
        const agentTaskResponse = await supabase
            .from('agent_tasks')
            .select('id, status')
            .eq('task_id', task.id)
            .eq('agent_id', task.assigned_agent_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const agentTask = agentTaskResponse.data as AgentTaskRecord | null;
        if (agentTask) {
            agentTaskId = agentTask.id;
            // Mark agent_task as running
            await supabase
                .from('agent_tasks')
                .update({ status: 'running', started_at: new Date().toISOString() })
                .eq('id', agentTaskId);
        }

        // 1. Fetch Agent
        const agentResponse = await supabase
            .from('agents')
            .select('*')
            .eq('id', task.assigned_agent_id)
            .single();

        const agent = agentResponse.data as Agent | null;
        const agentError = agentResponse.error;

        if (agentError || !agent) {
            throw new Error(`Failed to load agent: ${agentError?.message}`);
        }

        // Derive provider from agent or infer from model name
        const provider = agent.provider ?? inferProvider(agent.model);
        if (!provider) {
            throw new Error(`Cannot determine provider for agent "${agent.name}" with model "${agent.model}". Please update the agent's provider in Settings.`);
        }

        // 2. Fetch API Key for Agent's provider
        const apiKeyResponse = await supabase
            .from('api_keys')
            .select('*')
            .eq('workspace_id', task.workspace_id)
            .eq('provider', provider.toLowerCase())
            .single();

        const apiKeyData = apiKeyResponse.data as ApiKey | null;
        const keyError = apiKeyResponse.error;

        if (keyError || !apiKeyData) {
            throw new Error(`Failed to load API key for provider "${provider}". Please configure it in Settings.`);
        }

        const rawKey = decryptApiKey(apiKeyData.encrypted_key);

        // 3. Prepare Prompt
        const systemPrompt = agent.system_prompt || 'You are a helpful AI assistant.';
        const userPrompt = `Task Title: ${task.title}\n\nTask Description:\n${task.description}`;

        // Throttle DB updates to avoid rate limits (every ~500ms at most)
        let lastUpdate = 0;
        const updateResultStream = async (text: string) => {
            const now = Date.now();
            if (now - lastUpdate > 500) {
                lastUpdate = now;
                await supabase
                    .from('tasks')
                    .update({ result: text }) // Store the raw text string for MVP
                    .eq('id', task.id);
            }
        };

        // 4. Execute LLM
        let executionResult;
        const providerLower = provider.toLowerCase();

        try {
            if (providerLower === 'anthropic') {
                executionResult = await executeAnthropic(rawKey, agent.model, systemPrompt, userPrompt, updateResultStream);
            } else if (providerLower === 'openai') {
                executionResult = await executeOpenAI(rawKey, agent.model, systemPrompt, userPrompt, updateResultStream);
            } else if (providerLower === 'google') {
                executionResult = await executeGoogle(rawKey, agent.model, systemPrompt, userPrompt, updateResultStream);
            } else if (providerLower === 'openrouter') {
                const orModel = agent.model.replace(/^openrouter\//, '');
                executionResult = await executeOpenAI(rawKey, orModel, systemPrompt, userPrompt, updateResultStream, 'https://openrouter.ai/api/v1');
            } else if (providerLower === 'groq') {
                const groqModel = agent.model.replace(/^groq\//, '');
                executionResult = await executeOpenAI(rawKey, groqModel, systemPrompt, userPrompt, updateResultStream, 'https://api.groq.com/openai/v1');
            } else if (providerLower === 'mistral') {
                executionResult = await executeOpenAI(rawKey, agent.model, systemPrompt, userPrompt, updateResultStream, 'https://api.mistral.ai/v1');
            } else if (providerLower === 'cohere') {
                executionResult = await executeOpenAI(rawKey, agent.model, systemPrompt, userPrompt, updateResultStream, 'https://api.cohere.com/compatibility/v1');
            } else {
                throw new Error(`Execution for provider "${provider}" is not yet supported in the standalone runner.`);
            }
        } catch (llmError: unknown) {
            // Surface user-friendly message for invalid model IDs (400/404 from API)
            const msg = llmError instanceof Error ? llmError.message : String(llmError);
            if (msg.includes('400') || msg.includes('404') || msg.includes('not a valid model') || msg.includes('model_not_found')) {
                throw new Error(`Model "${agent.model}" is not available on ${provider}. Please update the agent's model in Settings → Agents.`);
            }
            throw llmError;
        }

        // 5. Finalize Task success
        await supabase
            .from('tasks')
            .update({
                status: 'completed',
                result: executionResult.result,
                metadata: { usage: executionResult.usage },
            })
            .eq('id', task.id);

        // 6. Finalize agent_task success
        if (agentTaskId) {
            await supabase
                .from('agent_tasks')
                .update({
                    status: 'completed',
                    result: { output: executionResult.result },
                    model_used: agent.model,
                    tokens_used: executionResult.usage.totalTokens,
                    cost_estimate_usd: executionResult.usage.costEstimateUSD,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', agentTaskId);
        }

        // 7. Write usage record
        await writeTaskUsageRecord({
            workspaceId: task.workspace_id,
            taskId: task.id,
            agentId: agent.id,
            provider: provider,
            model: agent.model,
            tokensUsed: executionResult.usage.totalTokens,
            costEstimateUsd: executionResult.usage.costEstimateUSD,
        });

        console.log(`[TaskRunner] Completed task ${task.id} successfully.`);

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[TaskRunner] Failed task ${task.id}:`, errMsg);

        // Finalize Task failure
        await supabase
            .from('tasks')
            .update({
                status: 'failed',
                error: errMsg,
            })
            .eq('id', task.id);

        // Finalize agent_task failure
        if (agentTaskId) {
            await supabase
                .from('agent_tasks')
                .update({
                    status: 'failed',
                    error_message: errMsg,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', agentTaskId);
        }
    }
}
