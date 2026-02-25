# Discord Server Setup — CrewForm

## Server Structure

### Categories & Channels

```
📢 ANNOUNCEMENTS
  #announcements      — Product updates, releases, milestones
  #changelog           — Version-by-version changelog

👋 COMMUNITY
  #introductions       — New members introduce themselves
  #general             — General discussion
  #show-and-tell       — Share your agent setups and workflows

🛠️ SUPPORT
  #help                — Get help with CrewForm
  #bug-reports         — Report bugs (template pinned)
  #feature-requests    — Suggest features (template pinned)

💻 DEVELOPMENT
  #contributing        — Discussion for contributors
  #pull-requests       — PR notifications (GitHub webhook)
  #ci-status           — CI build notifications (GitHub webhook)

🤖 AGENTS
  #agent-prompts       — Share and discuss system prompts
  #marketplace         — Marketplace agent discussions
  #pipeline-tips       — Pipeline team patterns and best practices
```

### Roles

| Role | Color | Permissions |
|------|-------|-------------|
| **Admin** | Red | Full permissions |
| **Moderator** | Orange | Manage messages, kick, mute |
| **Contributor** | Green | Access to #contributing, #pull-requests |
| **Beta Tester** | Purple | Access to #beta-feedback (private) |
| **Member** | Default | Standard access |

### Bots

- **GitHub Bot** — PR and CI notifications to #pull-requests and #ci-status
- **Welcome Bot** — Auto-welcome new members with getting started links

### Pinned Messages

**#help:**
> 👋 Welcome! Before asking for help:
> 1. Check the [docs](https://github.com/vincentgrobler/crewform/tree/main/docs)
> 2. Search this channel for similar questions
> 3. Include your error message and steps to reproduce

**#bug-reports:**
> 🐛 Bug Report Template:
> - **What happened:**
> - **What I expected:**
> - **Steps to reproduce:**
> - **Browser/OS:**
> - **Screenshots:**

**#feature-requests:**
> 💡 Feature Request Template:
> - **Feature:**
> - **Why it's useful:**
> - **Example use case:**

## Setup Checklist

- [ ] Create server with "CrewForm" name and logo
- [ ] Create all categories and channels
- [ ] Set up roles and permissions
- [ ] Add GitHub webhook for #pull-requests and #ci-status
- [ ] Pin message templates in #help, #bug-reports, #feature-requests
- [ ] Write welcome message for #announcements
- [ ] Configure auto-moderation (spam filter, link filter for new accounts)
- [ ] Create invite link (permanent, no expiry): `discord.gg/NpcWr9d7`
- [ ] Add server description and banner image
