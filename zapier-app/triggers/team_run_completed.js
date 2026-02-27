const { makeRestHookTrigger } = require('../lib/helpers');

module.exports = makeRestHookTrigger({
    key: 'team_run_completed',
    event: 'team_run.completed',
    noun: 'Team Run',
    label: 'Team Run Completed',
    desc: 'Triggers when a team run (pipeline or orchestrator) finishes successfully.',
    listUrl: '/api-runs',
});
