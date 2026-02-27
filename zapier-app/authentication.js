/**
 * CrewForm Zapier Authentication
 *
 * Uses API Key auth — the user enters their CrewForm REST API key,
 * which is sent as an X-API-Key header on all requests.
 *
 * The test function calls GET /api-me to verify the key is valid
 * and returns the connected account label.
 */

const BASE_URL = process.env.CREWFORM_API_URL;

const test = async (z, bundle) => {
    const response = await z.request({
        url: `${BASE_URL}/api-me`,
        method: 'GET',
    });

    if (response.status !== 200) {
        throw new z.errors.Error('Invalid API Key', 'AuthenticationError', response.status);
    }

    return response.data;
};

const getConnectionLabel = (z, bundle) => {
    // Display the workspace name in Zapier's connection list
    return `${bundle.inputData.workspace_name} (${bundle.inputData.email || bundle.inputData.id})`;
};

const authentication = {
    type: 'custom',

    fields: [
        {
            key: 'api_key',
            label: 'API Key',
            type: 'string',
            required: true,
            helpText: 'Your CrewForm REST API key. Find it in Settings → API Keys.',
        },
        {
            key: 'api_url',
            label: 'API URL',
            type: 'string',
            required: true,
            helpText: 'Your CrewForm Supabase URL (e.g. https://your-project.supabase.co/functions/v1)',
        },
    ],

    test: test,
    connectionLabel: getConnectionLabel,
};

// Middleware — injected into every request at the app level (index.js)
const addApiKeyHeader = (request, z, bundle) => {
    if (bundle.authData.api_url) {
        request.url = request.url.replace(BASE_URL || 'CREWFORM_API_URL', bundle.authData.api_url);
    }

    request.headers = request.headers || {};
    request.headers['X-API-Key'] = bundle.authData.api_key;
    request.headers['Content-Type'] = 'application/json';
    return request;
};

module.exports = { authentication, addApiKeyHeader };

