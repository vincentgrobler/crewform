import { supabase } from './supabase';
import { processTask } from './executor';
import { processPipelineRun } from './pipelineExecutor';
import { processOrchestratorRun } from './orchestratorExecutor';
import type { Task, TeamRun } from './types';

const POLL_INTERVAL_MS = 5000;
let isPolling = false;

async function poll() {
    if (isPolling) return;
    isPolling = true;

    try {
        // ─── 1. Check for pending tasks ──────────────────────────────────────
        const rpcResponse = await supabase.rpc('claim_next_task');
        const data = rpcResponse.data as Task[] | null;
        const error = rpcResponse.error;

        if (error) {
            console.error('[TaskRunner] RPC Error claiming task:', error.message);
        } else if (data && data.length > 0) {
            const claimedTask = data[0];
            processTask(claimedTask).catch((err: unknown) => {
                console.error(`[TaskRunner] Unhandled outer error processing task ${claimedTask.id}:`, err);
            });

            // If we found a task, poll again immediately
            isPolling = false;
            return await poll();
        }

        // ─── 2. Check for pending team runs ──────────────────────────────────
        const teamRunResponse = await supabase.rpc('claim_next_team_run');
        const teamRunData = teamRunResponse.data as TeamRun[] | null;
        const teamRunError = teamRunResponse.error;

        if (teamRunError) {
            console.error('[TaskRunner] RPC Error claiming team run:', teamRunError.message);
        } else if (teamRunData && teamRunData.length > 0) {
            const claimedRun = teamRunData[0];

            // Determine team mode to route to correct executor
            const teamResponse = await supabase
                .from('teams')
                .select('mode')
                .eq('id', claimedRun.team_id)
                .single();

            const teamMode = (teamResponse.data as { mode: string } | null)?.mode ?? 'pipeline';

            if (teamMode === 'orchestrator') {
                processOrchestratorRun(claimedRun).catch((err: unknown) => {
                    console.error(`[TaskRunner] Unhandled outer error processing orchestrator run ${claimedRun.id}:`, err);
                });
            } else {
                processPipelineRun(claimedRun).catch((err: unknown) => {
                    console.error(`[TaskRunner] Unhandled outer error processing team run ${claimedRun.id}:`, err);
                });
            }

            // If we found a run, poll again immediately
            isPolling = false;
            return await poll();
        }
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[TaskRunner] Unexpected error in polling loop:', errMsg);
    }

    isPolling = false;
}

console.log('[TaskRunner] Starting the Task Runner polling daemon...');
console.log(`[TaskRunner] Polling every ${POLL_INTERVAL_MS}ms for tasks and team runs.`);

// Start the polling interval
setInterval(() => { void poll(); }, POLL_INTERVAL_MS);

// Initial poll
void poll();

// Keep process alive
process.on('SIGINT', () => {
    console.log('[TaskRunner] Shutting down gracefully...');
    process.exit(0);
});
