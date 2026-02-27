/**
 * CrewForm Zapier Authentication
 *
 * Uses API Key auth — the user enters their CrewForm REST API key,
 * which is sent as an X-API-Key header on all requests.
 *
 * The test function calls GET /api-me to verify the key is valid
 * and returns the connected account label.
 */

const test = async (z, bundle) => {
    const response = await z.request({
        url: `${bundle.authData.api_url}/api-me`,
        method: 'GET',
    });

    if (response.status !== 200) {
        throw new z.errors.Error('Invalid API Key', 'AuthenticationError', response.status);
    }

    return response.data;
};

const getConnectionLabel = (z, bundle) => {
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

// Middleware — inject API key + base URL into every request
const addApiKeyHeader = (request, z, bundle) => {
    // Prefix relative URLs with the user-provided API URL
    if (bundle.authData.api_url && !request.url.startsWith('http')) {
        request.url = `${bundle.authData.api_url}${request.url}`;
    }

    request.headers = request.headers || {};
    request.headers['X-API-Key'] = bundle.authData.api_key;
    request.headers['Content-Type'] = 'application/json';
    return request;
};

module.exports = { authentication, addApiKeyHeader };


