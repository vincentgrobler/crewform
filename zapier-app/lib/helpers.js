/**
 * Shared helper to build REST Hook triggers.
 *
 * All CrewForm triggers follow the same pattern:
 * - subscribeHook: POST /api-hooks to register Zapier's callback URL
 * - unsubscribeHook: DELETE /api-hooks?id= to remove it
 * - performList: Polling fallback for sample data
 */

const getBaseUrl = (bundle) => {
    return bundle.authData.api_url || process.env.CREWFORM_API_URL;
};

/**
 * Create a REST Hook trigger definition for a given event.
 *
 * @param {string} key       - Zapier trigger key (e.g. 'task_completed')
 * @param {string} event     - CrewForm event name (e.g. 'task.completed')
 * @param {string} noun      - Display noun (e.g. 'Task')
 * @param {string} label     - Human-readable label
 * @param {string} desc      - Description shown in Zapier
 * @param {string} listUrl   - API endpoint for sample data (polling fallback)
 * @param {object} outputFields - Output field definitions
 */
const makeRestHookTrigger = ({ key, event, noun, label, desc, listUrl, outputFields }) => {
    return {
        key: key,
        noun: noun,

        display: {
            label: label,
            description: desc,
        },

        operation: {
            type: 'hook',

            // Called when a Zap is turned on — register the webhook
            performSubscribe: async (z, bundle) => {
                const response = await z.request({
                    url: `${getBaseUrl(bundle)}/api-hooks`,
                    method: 'POST',
                    body: {
                        event: event,
                        target_url: bundle.targetUrl,
                    },
                });

                return response.data;
            },

            // Called when a Zap is turned off — remove the webhook
            performUnsubscribe: async (z, bundle) => {
                const response = await z.request({
                    url: `${getBaseUrl(bundle)}/api-hooks?id=${bundle.subscribeData.id}`,
                    method: 'DELETE',
                });

                return response.data;
            },

            // Called when a webhook fires — process the incoming payload
            perform: async (z, bundle) => {
                // Zapier sends the raw webhook body in bundle.cleanedRequest
                return [bundle.cleanedRequest];
            },

            // Called for sample data (Zap setup) — polling fallback
            performList: async (z, bundle) => {
                const response = await z.request({
                    url: `${getBaseUrl(bundle)}${listUrl}`,
                    method: 'GET',
                });

                // Return array — Zapier expects a list
                const data = response.data;
                return Array.isArray(data) ? data.slice(0, 3) : [data];
            },

            // Describe the shape of data Zapier receives
            sample: {
                event: event,
                task_id: '00000000-0000-0000-0000-000000000000',
                team_run_id: null,
                task_title: 'Sample task title',
                agent_name: 'Sample Agent',
                status: 'completed',
                result_preview: 'This is a sample result preview...',
                error: null,
                timestamp: new Date().toISOString(),
            },

            outputFields: outputFields || [
                { key: 'event', label: 'Event Type' },
                { key: 'task_id', label: 'Task ID' },
                { key: 'team_run_id', label: 'Team Run ID' },
                { key: 'task_title', label: 'Title' },
                { key: 'agent_name', label: 'Agent / Team Name' },
                { key: 'status', label: 'Status' },
                { key: 'result_preview', label: 'Result Preview' },
                { key: 'error', label: 'Error Message' },
                { key: 'timestamp', label: 'Timestamp' },
            ],
        },
    };
};

module.exports = { makeRestHookTrigger, getBaseUrl };
