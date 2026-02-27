const { makeRestHookTrigger } = require('../lib/helpers');

module.exports = makeRestHookTrigger({
    key: 'team_run_failed',
    event: 'team_run.failed',
    noun: 'Team Run',
    label: 'Team Run Failed',
    desc: 'Triggers when a team run (pipeline or orchestrator) fails.',
    listUrl: '/api-runs',
});
