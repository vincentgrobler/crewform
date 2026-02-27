# CrewForm Zapier App

This directory contains the Zapier CLI integration for CrewForm.

## Setup

```bash
cd zapier-app
npm install

# Link to your Zapier developer account
npx zapier login
npx zapier register "CrewForm"
```

## Development

```bash
# Validate the app definition
npx zapier validate

# Test locally
npx zapier test

# Deploy to Zapier
npx zapier push
```

## Structure

```
zapier-app/
├── index.js              # App entry point
├── authentication.js     # API Key auth + test
├── lib/
│   └── helpers.js        # Shared REST Hook builder
├── triggers/
│   ├── task_started.js
│   ├── task_completed.js
│   ├── task_failed.js
│   ├── team_run_completed.js
│   └── team_run_failed.js
├── creates/
│   ├── create_task.js    # Create Task action
│   └── run_team.js       # Run Team action
└── package.json
```

## Triggers (REST Hooks)

| Trigger | Event | Description |
|---------|-------|-------------|
| Task Started | `task.started` | Fires when a task begins |
| Task Completed | `task.completed` | Fires when a task finishes |
| Task Failed | `task.failed` | Fires when a task fails |
| Team Run Completed | `team_run.completed` | Fires when a team run finishes |
| Team Run Failed | `team_run.failed` | Fires when a team run fails |

## Actions

| Action | Endpoint | Description |
|--------|----------|-------------|
| Create Task | `POST /api-tasks` | Creates a new task |
| Run Team | `POST /api-runs` | Starts a team run |
