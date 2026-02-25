# Beta Launch Checklist

## Pre-Launch (1 week before)

### Product
- [ ] All Milestone 6 tickets merged and deployed
- [ ] Lighthouse score ≥ 85
- [ ] Full user journey tested end-to-end
- [ ] Docker self-hosting verified on fresh machine
- [ ] No critical security issues open

### Content
- [ ] Product Hunt submission drafted ([product-hunt.md](./product-hunt.md))
- [ ] Show HN post drafted ([show-hn.md](./show-hn.md))
- [ ] Twitter thread drafted ([twitter-thread.md](./twitter-thread.md))
- [ ] Beta invite email template ready ([beta-invite.md](./beta-invite.md))

### Assets
- [ ] Product Hunt gallery images (5 screenshots)
- [ ] Product Hunt logo (240×240) and thumbnail (80×80)
- [ ] Hero image for social sharing (1200×630 OG image)
- [ ] Discord server fully set up ([discord-setup.md](./discord-setup.md))

### Docs
- [ ] README polished and up to date
- [ ] Quick Start guide tested by someone other than me
- [ ] API Reference reviewed
- [ ] Self-Hosting guide tested on fresh Docker install

---

## Launch Day

### Morning (before 8 AM ET)
- [ ] Ship Product Hunt listing (schedule for 12:01 AM PT)
- [ ] Post Show HN on Hacker News
- [ ] Post Twitter thread
- [ ] Share on LinkedIn

### During the day
- [ ] Monitor Product Hunt comments — respond to every one
- [ ] Monitor HN comments — respond to technical questions
- [ ] Monitor Twitter replies and quote tweets
- [ ] Monitor Discord for new members
- [ ] Fix any critical bugs reported immediately

### Evening
- [ ] Post a thank you update on Product Hunt
- [ ] Retweet/share best community responses

---

## Post-Launch (first week)

### Community
- [ ] Respond to all Discord messages within 4 hours
- [ ] Respond to all GitHub issues within 24 hours
- [ ] Send personal thank-you to every beta signup

### Metrics to Track
- [ ] Product Hunt upvotes and rank
- [ ] GitHub stars gained
- [ ] Discord members joined
- [ ] Beta signups
- [ ] First tasks run by new users
- [ ] Feature requests collected

### Iterate
- [ ] Compile top 5 feature requests
- [ ] Identify and fix top 3 UX friction points
- [ ] Plan Sprint 1 of Phase 2 based on feedback

---

## Go/No-Go Criteria (from Roadmap)

| Category | Criteria | Status |
|----------|----------|--------|
| **Security** | AES-256-GCM encryption. RLS on all tables. HTTPS. No secrets in git. | ✅ |
| **Functionality** | Full user journey e2e. Pipeline teams execute. Marketplace install works. Docker self-hosting works. | ✅ |
| **Performance** | Dashboard < 2s. Lighthouse ≥ 85. Initial bundle < 100KB gzipped. | ✅ |
| **Docs** | Quickstart, API docs, self-hosting guide complete. | ✅ |
| **Launch** | Product Hunt assets ready. crewform.tech live. | ⬜ |
