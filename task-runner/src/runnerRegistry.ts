import os from 'os';
import { supabase } from './supabase';

let runnerId: string | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

const HEARTBEAT_INTERVAL_MS = 10_000;
const INSTANCE_NAME = `${os.hostname()}-${process.pid}`;

/**
 * Register this task runner instance in the database.
 * Returns the assigned runner UUID.
 */
export async function registerRunner(): Promise<string> {
    const { data, error } = await supabase
        .from('task_runners')
        .insert({
            instance_name: INSTANCE_NAME,
            status: 'active',
            max_concurrency: 3,
            current_load: 0,
        })
        .select('id')
        .single();

    if (error || !data) {
        throw new Error(`Failed to register runner: ${error?.message ?? 'no data returned'}`);
    }

    runnerId = data.id as string;

    // Start heartbeat loop
    heartbeatInterval = setInterval(() => {
        void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return runnerId;
}

/**
 * Send a heartbeat to update last_heartbeat timestamp.
 */
async function sendHeartbeat(): Promise<void> {
    if (!runnerId) return;

    const { error } = await supabase
        .from('task_runners')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('id', runnerId);

    if (error) {
        console.error(`[Runner ${INSTANCE_NAME}] Heartbeat failed:`, error.message);
    }
}

/**
 * Deregister this runner (delete its row) on graceful shutdown.
 */
export async function deregisterRunner(): Promise<void> {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    if (!runnerId) return;

    const { error } = await supabase
        .from('task_runners')
        .delete()
        .eq('id', runnerId);

    if (error) {
        console.error(`[Runner ${INSTANCE_NAME}] Deregister failed:`, error.message);
    } else {
        console.log(`[Runner ${INSTANCE_NAME}] Deregistered successfully.`);
    }

    runnerId = null;
}

/**
 * Get the current runner ID. Returns null if not registered.
 */
export function getRunnerId(): string | null {
    return runnerId;
}

/**
 * Get the human-readable instance name.
 */
export function getInstanceName(): string {
    return INSTANCE_NAME;
}
