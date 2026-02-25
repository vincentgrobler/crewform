import { supabase } from './supabase';
import { processTask } from './executor';
import type { Task } from './types';

const POLL_INTERVAL_MS = 5000;
let isPolling = false;

async function poll() {
    if (isPolling) return;
    isPolling = true;

    try {
        // Call the RPC to atomically claim ONE pending task
        const { data, error } = await supabase.rpc('claim_next_task');

        if (error) {
            console.error('[TaskRunner] RPC Error claiming task:', error.message);
        } else if (data && data.length > 0) {
            const claimedTask = data[0] as Task;
            // Note: We don't await processTask here! 
            // We fire and forget so the polling loop can continue to pick up other tasks
            // up to any concurrency limits we might set.
            processTask(claimedTask).catch(err => {
                console.error(`[TaskRunner] Unhandled outer error processing task ${claimedTask.id}:`, err);
            });

            // If we found a task, poll again immediately without waiting
            isPolling = false;
            return poll();
        }
    } catch (err: any) {
        console.error('[TaskRunner] Unexpected error in polling loop:', err.message);
    }

    isPolling = false;
}

console.log('[TaskRunner] Starting the Task Runner polling daemon...');
console.log(`[TaskRunner] Polling every ${POLL_INTERVAL_MS}ms for new tasks.`);

// Start the polling interval
setInterval(poll, POLL_INTERVAL_MS);

// Initial poll
poll();

// Keep process alive
process.on('SIGINT', () => {
    console.log('[TaskRunner] Shutting down gracefully...');
    process.exit(0);
});
