const { makeRestHookTrigger } = require('../lib/helpers');

module.exports = makeRestHookTrigger({
    key: 'task_completed',
    event: 'task.completed',
    noun: 'Task',
    label: 'Task Completed',
    desc: 'Triggers when a task finishes successfully.',
    listUrl: '/api-tasks?status=completed',
});
