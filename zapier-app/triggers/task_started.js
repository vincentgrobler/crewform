const { makeRestHookTrigger } = require('../lib/helpers');

module.exports = makeRestHookTrigger({
    key: 'task_started',
    event: 'task.started',
    noun: 'Task',
    label: 'Task Started',
    desc: 'Triggers when a task begins execution.',
    listUrl: '/api-tasks?status=running',
});
