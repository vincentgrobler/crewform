import { supabase } from './supabase';
import { executeAnthropic } from './providers/anthropic';
import { executeOpenAI } from './providers/openai';
import { executeGoogle } from './providers/google';
import { decryptApiKey } from './crypto';
import type { Task, Agent, ApiKey } from './types';

export async function processTask(task: Task) {
    try {
        console.log(`[TaskRunner] Claimed task ${task.id} (Agent: ${task.assigned_agent_id})`);

        if (!task.assigned_agent_id) {
            throw new Error('Task has no assigned agent.');
        }

        // 1. Fetch Agent
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('id', task.assigned_agent_id)
            .single();

        if (agentError || !agent) {
            throw new Error(`Failed to load agent: ${agentError?.message}`);
        }

        // 2. Fetch API Key for Agent's provider
        const { data: apiKeyData, error: keyError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('workspace_id', task.workspace_id)
            .eq('provider', (agent as Agent).provider)
            .single();

        if (keyError || !apiKeyData) {
            throw new Error(`Failed to load API key for provider ${(agent as Agent).provider}. Please configure it in Settings.`);
        }

        const rawKey = decryptApiKey((apiKeyData as ApiKey).encrypted_key);

        // 3. Prepare Prompt
        const systemPrompt = (agent as Agent).system_prompt || 'You are a helpful AI assistant.';
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
        const provider = (agent as Agent).provider.toLowerCase();

        if (provider === 'anthropic') {
            executionResult = await executeAnthropic(rawKey, (agent as Agent).model, systemPrompt, userPrompt, updateResultStream);
        } else if (provider === 'openai') {
            executionResult = await executeOpenAI(rawKey, (agent as Agent).model, systemPrompt, userPrompt, updateResultStream);
        } else if (provider === 'google') {
            executionResult = await executeGoogle(rawKey, (agent as Agent).model, systemPrompt, userPrompt, updateResultStream);
        } else {
            throw new Error(`Execution for provider ${provider} is not yet supported in the standalone runner.`);
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
    }
}
