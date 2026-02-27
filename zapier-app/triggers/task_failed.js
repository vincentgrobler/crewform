const { makeRestHookTrigger } = require('../lib/helpers');

module.exports = makeRestHookTrigger({
    key: 'task_failed',
    event: 'task.failed',
    noun: 'Task',
    label: 'Task Failed',
    desc: 'Triggers when a task fails.',
    listUrl: '/api-tasks?status=failed',
});
