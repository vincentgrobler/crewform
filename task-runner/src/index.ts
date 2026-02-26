import { supabase } from './supabase';
import { processTask } from './executor';
import { processPipelineRun } from './pipelineExecutor';
import { processOrchestratorRun } from './orchestratorExecutor';
import { registerRunner, deregisterRunner, getRunnerId, getInstanceName, runRecoverySweep, RECOVERY_INTERVAL_MS } from './runnerRegistry';
import type { Task, TeamRun } from './types';

const POLL_INTERVAL_MS = 5000;
let isPolling = false;

function log(msg: string) {
    const name = getInstanceName();
    console.log(`[Runner ${name}] ${msg}`);
}

function logError(msg: string, err?: unknown) {
    const name = getInstanceName();
    if (err) {
        console.error(`[Runner ${name}] ${msg}`, err);
    } else {
        console.error(`[Runner ${name}] ${msg}`);
    }
}

async function poll() {
    if (isPolling) return;
    isPolling = true;

    const runnerId = getRunnerId();

    try {
        // ─── 1. Check for pending tasks ──────────────────────────────────────
        const rpcResponse = await supabase.rpc('claim_next_task', {
            p_runner_id: runnerId,
        });
        const data = rpcResponse.data as Task[] | null;
        const error = rpcResponse.error;

        if (error) {
            logError(`RPC Error claiming task: ${error.message}`);
        } else if (data && data.length > 0) {
            const claimedTask = data[0];
            log(`Claimed task ${claimedTask.id}`);
            processTask(claimedTask).catch((err: unknown) => {
                logError(`Unhandled outer error processing task ${claimedTask.id}:`, err);
            });

            // If we found a task, poll again immediately
            isPolling = false;
            return await poll();
        }

        // ─── 2. Check for pending team runs ──────────────────────────────────
        const teamRunResponse = await supabase.rpc('claim_next_team_run', {
            p_runner_id: runnerId,
        });
        const teamRunData = teamRunResponse.data as TeamRun[] | null;
        const teamRunError = teamRunResponse.error;

        if (teamRunError) {
            logError(`RPC Error claiming team run: ${teamRunError.message}`);
        } else if (teamRunData && teamRunData.length > 0) {
            const claimedRun = teamRunData[0];
            log(`Claimed team run ${claimedRun.id}`);

            // Determine team mode to route to correct executor
            const teamResponse = await supabase
                .from('teams')
                .select('mode')
                .eq('id', claimedRun.team_id)
                .single();

            const teamMode = (teamResponse.data as { mode: string } | null)?.mode ?? 'pipeline';

            if (teamMode === 'orchestrator') {
                processOrchestratorRun(claimedRun).catch((err: unknown) => {
                    logError(`Unhandled outer error processing orchestrator run ${claimedRun.id}:`, err);
                });
            } else {
                processPipelineRun(claimedRun).catch((err: unknown) => {
                    logError(`Unhandled outer error processing team run ${claimedRun.id}:`, err);
                });
            }

            // If we found a run, poll again immediately
            isPolling = false;
            return await poll();
        }
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logError(`Unexpected error in polling loop: ${errMsg}`);
    }

    isPolling = false;
}

// ─── Startup ─────────────────────────────────────────────────────────────────

async function start() {
    try {
        const id = await registerRunner();
        log(`Registered with ID ${id}`);
        log(`Polling every ${POLL_INTERVAL_MS}ms for tasks and team runs.`);
        log(`Recovery sweep every ${RECOVERY_INTERVAL_MS}ms for stale runners.`);

        // Start the polling interval
        setInterval(() => { void poll(); }, POLL_INTERVAL_MS);

        // Start the recovery sweep interval
        setInterval(() => { void runRecoverySweep(); }, RECOVERY_INTERVAL_MS);

        // Initial poll
        void poll();
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[TaskRunner] Failed to start: ${errMsg}`);
        process.exit(1);
    }
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

async function shutdown(signal: string) {
    log(`Received ${signal}, shutting down gracefully...`);
    await deregisterRunner();
    process.exit(0);
}

process.on('SIGINT', () => { void shutdown('SIGINT'); });
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });

// Start
void start();
