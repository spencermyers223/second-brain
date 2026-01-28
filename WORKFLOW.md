# Second Brain Workflow Guide

## Overview

The Second Brain is our central hub for:
1. **Task Management** — What Jarvis is working on
2. **Deliverable Review** — Content Spencer needs to approve
3. **Project Organization** — Clear separation by project

---

## For Spencer: Quick Views

### 🔴 Review Queue (CHECK DAILY)
**Filter:** `status = review-needed`

Items here are finished and need your review. For each item:
- ✅ **Approve** → Change status to `approved`
- 🔄 **Request Changes** → Change status to `changes-requested`, add feedback in notes under `--- FEEDBACK ---`
- ❌ **Reject** → Change status to `rejected`

### 🟢 Approved (Ready to Publish)
**Filter:** `status = approved`

Items you've approved that Jarvis will publish/deploy. Once published, Jarvis moves to `done`.

### 🟡 Changes Requested
**Filter:** `status = changes-requested`

Items you sent back for revisions. Jarvis will address feedback and return to `review-needed`.

### 📁 By Project
**Filter:** `project = xthread` (or `winfirst`, `nomad-research`, `general`)

See all items for a specific project regardless of status.

---

## Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `deliverables` | Finished work for review | Tweet drafts, docs, branding, videos |
| `tasks` | Work items with clear scope | "Fix bug X", "Add feature Y" |
| `ideas` | Future possibilities | Feature ideas, marketing concepts |
| `goals` | North star objectives | "First paying customer by Feb" |
| `research` | Reference material | Competitive analysis, market research |
| `bugs` | Bug fixes | UI issues, errors |

---

## Statuses (Workflow)

```
backlog → in-progress → review-needed → approved → done
                              ↓              ↑
                    changes-requested ───────┘
                              ↓
                          rejected
```

| Status | Meaning | Who Acts |
|--------|---------|----------|
| `backlog` | Queued, not started | Jarvis picks up |
| `in-progress` | Jarvis working on it | Jarvis |
| `review-needed` | Ready for review | **Spencer reviews** |
| `approved` | Spencer approved | Jarvis publishes |
| `changes-requested` | Needs revisions | Jarvis revises |
| `done` | Published/complete | Archive |
| `rejected` | Not moving forward | Archive |

---

## Projects

| Project | Description |
|---------|-------------|
| `xthread` | Main product — AI content tool |
| `winfirst` | Habit tracking app |
| `nomad-research` | Community/newsletter |
| `general` | Cross-project or admin |

---

## Content Storage

### Where Content Lives

**IN the Second Brain:**
- Tweet drafts → Full text in `notes` field
- Documents → Markdown in `notes` OR uploaded as attachment
- Images → Uploaded as attachment
- Videos → Uploaded as attachment

**NOT in GitHub:**
- Don't put marketing content in GitHub
- GitHub is for code only
- If referencing code changes, put summary in notes + link to PR

### Notes Format

```markdown
## Summary
Brief description of the deliverable

## Content
[Full tweet text / document content / etc.]

## Files
- See attachments for images/videos

--- FEEDBACK ---
[Spencer adds feedback here when requesting changes]

--- REVISION ---
[Jarvis documents what was changed]
```

---

## Priority

| Priority | Meaning |
|----------|---------|
| `high` | Do this today/tomorrow |
| `medium` | Do this this week |
| `low` | Do when high/medium are done |

---

## Tags

Use tags for additional filtering:
- `marketing` — Marketing content
- `video` — Video content
- `branding` — Brand assets
- `copy` — Written content
- `feature` — Product features
- `bug` — Bug fixes

---

## Daily Workflow

### Jarvis (via heartbeat)
1. Check `in-progress` items assigned to me — continue working
2. Check `changes-requested` — address Spencer's feedback
3. Check `backlog` — pick up highest priority item
4. Move completed work to `review-needed`

### Spencer
1. Check `review-needed` — review and approve/reject
2. Check `approved` — confirm items are published
3. Add new tasks to `backlog` as needed

---

## Examples

### Tweet Batch Deliverable
```
Title: Tweet drafts for @nomad_spencer (16 posts)
Category: deliverables
Project: xthread
Status: review-needed
Priority: high
Assignee: spencer (for review)

Notes:
## Summary
16 tweets ready for review — build in public, hot takes, product teasers

## Tweet 1: Weekly Update
Week 4 building xthread:
✅ Shipped algorithm scoring
✅ Content calendar launched
❌ Auth bugs took 2 days
Next: Marketing push

## Tweet 2: Hot Take
[... full tweet text ...]

[etc.]
```

### Feature Task
```
Title: Add dark mode toggle
Category: tasks
Project: xthread
Status: backlog
Priority: medium
Assignee: jarvis

Notes:
## Scope
- Add toggle in settings
- Persist preference
- Apply to all pages

## Acceptance Criteria
- [ ] Toggle visible in settings
- [ ] Preference saved
- [ ] All pages respect setting
```
